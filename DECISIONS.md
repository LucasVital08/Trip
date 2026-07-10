# DECISIONS.md — registro de decisões

Decisões tomadas durante a construção, com contexto e alternativas. Onde o
prompt dava um default, ele foi seguido salvo justificativa registrada aqui.

## 1. Stack

**Next.js 16 (App Router) + TypeScript + Tailwind v4 + PostgreSQL + Prisma 6 + Auth.js v5.**
Seguindo os defaults do briefing. Notas:

- **Prisma 6 (e não 7):** a v7 exige driver adapters + configuração ESM nova;
  a v6 é estável, amplamente documentada e suficiente. Upgrade é incremental.
- **Backend nas route handlers/server actions do próprio Next:** um único
  deploy, menos infraestrutura, e o domínio já está isolado em `src/lib` +
  `src/providers` — extrair um serviço separado depois é mecânico.
- **Auth.js v5 com sessões JWT:** credenciais (e-mail/senha com bcrypt) sempre
  ativas; Google OAuth liga automaticamente quando `AUTH_GOOGLE_ID/SECRET`
  existem (Apple seguiria o mesmo padrão). Verificação de telefone por OTP
  ficou como gancho (campo `phoneVerified` no schema) — exige provedor de SMS.

## 2. Dinheiro

**Inteiros em centavos (`Int`), sempre.** Nada de float em valor monetário.
Formatação BRL centralizada em `src/lib/money.ts`.

## 3. Composição de preço e taxa

**A taxa Trip (12%, `PLATFORM_FEE_PERCENT`) é somada por cima do preço do
motorista** — o motorista recebe 100% do valor que anunciou:

```
subtotal = preço/assento × assentos      → repasse integral ao motorista
taxa     = subtotal × 12% (+ taxa fixa, hoje 0)
total    = subtotal + taxa               → pago pelo passageiro
```

Alternativa considerada: descontar a taxa do motorista (à la Uber). Rejeitada
porque (a) o pitch ao motorista fica mais forte ("o preço é seu, inteiro");
(b) a transparência no checkout ("taxa de serviço Trip") reforça o
enquadramento de intermediação. Ganchos prontos no código: `fixedFeeCents`
(taxa fixa por reserva) e `premiumDriverFeePercent` (assinatura premium com
taxa menor).

## 4. Derivação da faixa de experiência (Econômico / Conforto / Premium)

Pontuação = **pesos dos opcionais** (catálogo `Amenity.tierWeight`, ajustável
sem deploy) + **bônus do veículo**:

- Opcionais de conforto: ar-condicionado 2, Wi-Fi 2, água/cortesia 1, playlist 1,
  parada café 1, bagagem extra 1, USB 1, assento infantil 1.
- Preferências de convivência pesam **0** (silêncio, bom papo, pet, não
  fumante): definem o *clima*, não o *nível* da experiência.
- Veículo: idade ≤3 anos +2, ≤7 anos +1; categoria SUV/minivan/picape +2,
  sedã +1, hatch +0.
- Régua: `<4 → Econômico`, `4–8 → Conforto`, `≥9 → Premium`.

A faixa é recalculada e **persistida** na publicação (não muda depois que os
passageiros compraram baseados nela). Testes cobrem as fronteiras.

## 5. Sugestão de preço (referência, nunca teto)

`rateio = km × R$0,62 (combustível) + pedágio estimado, dividido por
(assentos + 1)`. Faixa sugerida: `[rateio, rateio × 2,2]`, arredondada a
R$ 5, com piso de R$ 10. O formulário do motorista mostra a faixa e reforça
"é só referência: o preço é seu" — importante para a tese de preço livre.

## 6. Fluxo financeiro (escrow e repasse)

Modelado como marketplace de intermediação:

1. Reserva cria `Booking` com fotografia de preços + `Payment` no provedor;
2. Pix fica `PENDING` e confirma **via webhook** (`/api/webhooks/payment`,
   assinatura validada pelo provedor); cartão aprova síncrono no mock;
3. Confirmação cria `Payout` **HELD** (custódia) com o subtotal do motorista;
4. Motorista marca a viagem concluída → payouts **RELEASED**;
5. Transferência efetiva (RELEASED → PAID) é do provedor/rotina de payout —
   no mock, o seed demonstra os três estados.

Cancelamentos: passageiro segue a política (§7); motorista cancela → reembolso
integral de todos + `Payout REVERSED`.

**Concorrência de assentos:** decremento atômico
(`updateMany ... seatsAvailable >= seats`) dentro de transação — sem
overbooking sob corrida. Reserva não paga expira (janela de 30 min,
`paymentExpiresMinutes`; a expiração automática por job é gancho — hoje o
webhook `payment.failed` cobre o caminho).

## 7. Política de cancelamento (passageiro)

- ≥ 24h antes da saída: **reembolso integral**;
- entre 24h e 3h: **50%**;
- < 3h: **sem reembolso** (o motorista contou com o assento).

Parametrizada em `src/config/platform.ts`, exibida no checkout, na reserva e
em /como-funciona. Testes cobrem as fronteiras (24h exato = integral).

## 8. Pagamentos — provedor

**Default implementado: `MockPaymentProvider`** (Pix com copia-e-cola +
confirmação via webhook; cartão com aprovação/recusa determinística — final
`0002` recusa, padrão Stripe de cartão de teste).

**Escolha para produção: Stripe Connect** (destination charges +
`application_fee_amount`), esqueleto em `providers/payments/stripe.ts` com o
fluxo documentado. Motivo: maturidade de API e suporte a Pix para contas BR.
Mercado Pago/Pagar.me/Asaas são plugáveis pela mesma interface. A simulação
de Pix em dev usa **o mesmo caminho do webhook** que um provedor real usaria —
nada de atalho que esconderia bug de integração.

## 9. Mapas — provedor "static"

Autocomplete e rotas servidos por um **catálogo próprio de 20 cidades do NE**
(nome, UF, lat/lng) + estimativa `haversine × 1,25` (fator rodoviário) e
75 km/h médios. O mapa da rota é um **SVG desenhado localmente** (litoral NE
estilizado + rota tracejada âmbar) — zero dependência de rede/chave, estética
própria da marca. Google/Mapbox entram pela interface `MapsProvider` quando
houver chave. Bônus: catálogo fechado de cidades = qualidade de dados na busca
(sem "Recife" vs "recife-PE" vs typo).

## 10. KYC

`MockKycProvider` valida **dígitos verificadores reais de CPF** + nome
completo: dá para demonstrar aprovação e recusa sem credencial. Upload de
documento/selfie e provedores reais (idwall, unico, Datavalid) entram pela
interface `KycProvider` (campos `documentUrl`/`selfieUrl` já existem no
schema). Motoristas: verificação obrigatória antes de publicar. Passageiros:
opcional/incentivada (selo).

## 11. Segurança do produto

- Link público de acompanhamento por reserva (`shareToken` opaco) — rota
  `/acompanhar/[token]` mostra rota, horários, carro, placa e motorista sem
  login;
- Contato de segurança no perfil; página de acompanhamento orienta 190/193;
- Chat interno por viagem (telefone não exposto);
- Denúncia (`Report`) com motivo tipado + bloqueio (`User.blockedAt` exclui
  o motorista da busca);
- Selo "Verificado" em cards, detalhe, reserva e página de acompanhamento.

## 12. Busca e ordenação

Ordenação **"Recomendado"** = 55% reputação (média × fator de volume até 5
avaliações) + 30% preço relativo + 15% verificado; motorista novo recebe score
neutro (0,35) para não ser enterrado. Filtros de opcionais são **AND** (quem
filtra "ar + pet" quer os dois). Preço máximo via slider (R$ 300 = sem teto).

## 13. Marca

Nome de exibição, tagline e e-mails centralizados em `src/config/brand.ts`
(o nome "Trip" é difícil de registrar — trocar por variação é editar um
arquivo). Assinatura visual: componente `BrandMark` (Trip + ponto âmbar) e
`RoadDivider` (faixa tracejada de rodovia). Paleta e tipografia (Fraunces +
DM Sans) herdadas do protótipo validado, declaradas como tokens Tailwind v4.

## 14. i18n

PT-BR como idioma único **nesta fase**, com strings nos componentes. Datas e
moeda já passam por `Intl` (`pt-BR`, fuso `America/Recife`) centralizados em
`lib/dates.ts`/`lib/money.ts` — o caminho para EN é extrair strings para um
dicionário (next-intl), sem retrabalho de formatação. Decisão: não pagar o
custo de abstração antes de existir demanda.

## 15. Testes

- **Unitários** (25): composição de preço/taxa, arredondamento, política de
  reembolso (fronteiras), derivação de faixa (fronteiras), sugestão de preço,
  mock de pagamento (Pix pendente, cartão aprovado/recusado, assinatura de
  webhook), CPF, parsing BRL, formato do código de reserva.
- **Integração** (4, contra Postgres real): webhook `payment.paid` confirma
  reserva + cria payout HELD; `payment.failed` expira e devolve assentos;
  assinatura inválida rejeitada sem efeito; **idempotência** do webhook.
- O webhook foi extraído para `lib/booking-service.ts` (sem dependência de
  auth) — testável e reutilizável pelo caminho síncrono e assíncrono.

## 16. Fora de escopo desta entrega (ganchos prontos)

- Job de expiração de reservas Pix não pagas (janela configurada; hoje o
  fluxo cobre via webhook de falha);
- Provedores reais (Stripe, KYC, e-mail/SMS) — interfaces e esqueletos prontos;
- Upload de fotos (carro/avatar) — campos no schema, avatars por iniciais;
- Painel de moderação para `Report` (modelo e action prontos);
- Assinatura premium de motorista, publicidade contextual, seguro embutido —
  ganchos econômicos em `config/platform.ts`;
- Verificação de telefone por OTP.
