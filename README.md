# Trip. — marketplace de viagens compartilhadas

> **A estrada é melhor acompanhada.** Motoristas que já vão viajar oferecem os
> lugares livres do carro; passageiros escolhem a viagem pela **experiência** —
> o carro, os opcionais, o clima a bordo, a reputação — não só pelo preço.

O Trip ocupa o espaço entre o BlaBlaCar (preço travado no rateio, sem
intermediação de pagamento) e a Uber (preço por algoritmo, commodity urbana):

- **Preço livre definido pelo motorista** — a plataforma sugere uma faixa
  (rateio → experiência completa), mas nunca impõe;
- **Taxa de serviço transparente** (12%, configurável) somada ao preço do
  motorista e exibida no checkout;
- **Lógica Airbnb**: viagens declaram opcionais (ar, Wi-Fi, pet, silêncio…),
  são etiquetadas por faixa de experiência (Econômico / Conforto / Premium) e
  filtradas por isso na busca. Um Uno a preço de rateio e um Compass premium
  convivem na mesma rota sem se canibalizar.

**Enquadramento:** o Trip é uma **plataforma de intermediação** (marketplace,
análogo ao Airbnb) — conecta motoristas e passageiros e cobra taxa de serviço;
o acordo de transporte é entre os usuários. Esse posicionamento permeia a
modelagem de dados (Payment/Payout separados, escrow), a copy e os termos.

Foco inicial: rotas intermunicipais e interestaduais do Nordeste
(Recife, Caruaru, João Pessoa, Natal, Fortaleza, Maceió…).

---

## Stack

| Camada | Escolha |
| --- | --- |
| Framework | Next.js 16 (App Router) + React 19 + TypeScript |
| Estilo | Tailwind CSS v4 (tokens da marca em `globals.css`) |
| Banco | PostgreSQL 16 + Prisma 6 |
| Auth | Auth.js v5 (credenciais + Google OAuth opcional), sessões JWT |
| Pagamentos | Adaptador `PaymentProvider` — mock (dev) / esqueleto Stripe Connect |
| KYC | Adaptador `KycProvider` — mock com validação real de CPF |
| Mapas | Adaptador `MapsProvider` — "static" (catálogo + haversine, sem rede) |
| Notificações | Adaptador `NotificationProvider` — console (dev) |
| Testes | Vitest (unitários de regra + integração com Postgres) |

Todos os provedores externos ficam atrás de **interfaces com implementação
mock** — o app roda ponta a ponta sem nenhuma credencial externa.

## Como rodar localmente

Pré-requisitos: Node 22+, pnpm 10+, Docker (para o Postgres).

```bash
# 1. dependências
pnpm install

# 2. banco de dados
docker compose up -d db

# 3. ambiente
cp .env.example .env
# preencha AUTH_SECRET (openssl rand -base64 32); o restante já funciona em dev

# 4. migrations + seed (cidades do NE, motoristas, 60 viagens, avaliações)
pnpm db:migrate
pnpm db:seed

# 5. subir
pnpm dev
# → http://localhost:3000
```

### Contas de demonstração (senha `trip123`)

Não existem tipos de conta separados: todo `User` pode reservar lugares e,
depois de verificar identidade/CNH, publicar viagens na mesma sessão e perfil.

| Conta | Cenário inicial |
| --- | --- |
| `passageiro@trip.dev` | Passageira com reserva futura, favoritos e chat |
| `motorista@trip.dev` | Motorista verificado com viagens publicadas e ganhos |

### Fluxos para experimentar

1. **Buscar e reservar**: busque Recife → Caruaru, filtre por opcionais,
   abra uma viagem, reserve com **Pix** (use o botão “simular pagamento” do
   ambiente de teste — ele chama o webhook, como um provedor real faria) ou
   **cartão** (qualquer número aprova; final `0002` recusa).
2. **Cancelar**: na reserva, veja a política de reembolso aplicada à hora.
3. **Virar motorista**: em “Oferecer carona”, passe pelo KYC simulado
   (qualquer CPF matematicamente válido aprova), cadastre um carro e publique
   uma viagem — repare na sugestão de faixa de preço e na derivação
   automática de Econômico/Conforto/Premium.
4. **Concluir viagem e avaliar**: como motorista, marque uma viagem passada
   como concluída (libera o repasse em custódia); os dois lados avaliam.
5. **Segurança**: em qualquer reserva confirmada, copie o link
   “acompanhar viagem” e abra numa janela anônima.

## Scripts

```bash
pnpm dev          # desenvolvimento
pnpm build        # build de produção
pnpm start        # servir produção
pnpm lint         # ESLint
pnpm test         # vitest (unit + integração; integração usa o Postgres do .env)
pnpm db:migrate   # prisma migrate dev
pnpm db:seed      # popular dados de demonstração
pnpm db:reset     # zerar banco + migrations + seed
```

## Variáveis de ambiente

Ver **`.env.example`** — documentado chave a chave. Resumo:

| Chave | Função |
| --- | --- |
| `DATABASE_URL` | Postgres |
| `AUTH_SECRET` / `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | Auth.js (Google é opcional; o botão só aparece com as chaves) |
| `PAYMENT_PROVIDER` | `mock` (dev) ou `stripe` |
| `KYC_PROVIDER`, `MAPS_PROVIDER`, `NOTIFICATION_PROVIDER` | provedores plugáveis |
| `PLATFORM_FEE_PERCENT` | taxa de serviço (default 12) |
| `CRON_SECRET` | protege o job `POST /api/jobs/expire-bookings` |
| `ALLOW_MOCK_PAYMENTS` | liberação explícita do mock em produção (somente demo) |
| `ALLOW_MOCK_KYC` | liberação explícita do KYC mock em produção (somente demo) |
| `MEDIA_PROVIDER` | `local` (desenvolvimento) ou `cloudinary` (produção) |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | armazenamento persistente das fotos dos veículos |
| `ALLOW_LOCAL_UPLOADS` | libera armazenamento local em build de demonstração |

## Como trocar provedores

Cada integração vive em `src/providers/<domínio>/` com uma interface
(`types.ts`), implementações e uma factory (`index.ts`) que resolve pela env:

1. Implemente a interface (ex.: `class MercadoPagoProvider implements PaymentProvider`);
2. Registre o case na factory;
3. Aponte a env (`PAYMENT_PROVIDER=mercadopago`).

O restante do app não muda — actions e webhook falam apenas com a interface.
O fluxo assíncrono (Pix) confirma via `POST /api/webhooks/payment`, com
validação de assinatura delegada ao provedor.

## Arquitetura (visão rápida)

```
src/
  config/        marca (nome parametrizado) e regras econômicas da plataforma
  lib/           domínio puro: pricing, tier, cancelamento, busca, sessão
  providers/     payments/ kyc/ maps/ notifications/ (interface + mock + factory)
  actions/       server actions (reserva, publicação, chat, avaliação, KYC…)
  app/           rotas (App Router) + APIs (webhook, cidades, sugestão de preço)
  components/    UI (tokens da marca, mobile-first, acessível)
prisma/          schema, migrations, seed realista do NE
tests/           unitários (pricing/tier/providers) + integração (webhook/reserva)
```

Decisões relevantes (regra da faixa, política de repasse, escolha de
provedores, i18n, monetização futura): **`DECISIONS.md`**.

## Deploy

- **Vercel + Postgres gerenciado (Neon/Supabase)**: configure as envs e rode
  `pnpm prisma migrate deploy` no build. Pagamento e KYC mock são bloqueados
  por padrão em produção; as flags `ALLOW_MOCK_*` existem apenas para demos.
- **Docker**: `docker compose --profile prod up --build` sobe app + banco
  (o app aplica migrations no boot; rode o seed manualmente se quiser dados
  demo).

## Jurídico

`/termos` e `/privacidade` trazem rascunhos redigidos em coerência com o
enquadramento de marketplace de intermediação (LGPD, CDC, Marco Civil) —
**pendentes de revisão por advogado** antes do lançamento.
