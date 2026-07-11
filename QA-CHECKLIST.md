# QA-CHECKLIST — roteiro de teste manual do Trip

> ## ✅ Execução automatizada — 11/07/2026
> A suíte `scripts/qa-e2e.mjs` (Chromium + asserts no banco) executou **41/41
> casos com sucesso** cobrindo: busca/filtros/ordenação (1.1–1.3, 1.5–1.8,
> 1.10), detalhe e breakdown (2.1–2.3, 2.5), reserva Pix com webhook, cartão
> aprovado/recusado, duplicada, própria viagem e link público (3.1–3.4,
> 3.6–3.8, sendo 3.1 com 2 assentos = 3.5), cancelamento com reembolso integral
> e cancelamento pelo motorista (4.1, 4.3 — janelas de 50%/0% cobertas por
> teste unitário), KYC aprovado/recusado, veículo, publicação com sugestão e
> faixa dinâmica, conclusão com liberação de repasse e extrato (5.1–5.6,
> 5.8–5.9), avaliação mútua com agregados (6.1–6.3), conta, acesso e rotas
> protegidas (7.1–7.5), overflow mobile 390px e submit por teclado (8.1–8.2).
>
> **Bug encontrado e corrigido (B1):** o React 19 reseta formulários após
> cada server action — quando uma action retornava erro (KYC recusado, placa
> inválida, cartão recusado…), os campos digitados eram apagados e o
> `required` do navegador travava silenciosamente a segunda tentativa.
> Corrigido devolvendo os valores no estado da action (`state.values`) e
> repopulando via `defaultValue` (`src/lib/form-values.ts`).
>
> **Restam para teste manual/visual:** 1.4, 1.9, 2.4, 2.6, 5.7, 8.3 e 8.4
> (validações visuais e de gosto — zoom 200%, formatos, painel).



Marque cada caso: ✅ passou · ❌ falhou (anote o que viu) · ⏭ não testado.
Contas demo (senha `trip123`): `passageiro@trip.dev` (Marina) e
`motorista@trip.dev` (João). CPF de teste válido para KYC: `529.982.247-25`.
Cartão de teste: qualquer número aprova; final `0002` recusa.

> Teste em produção (Vercel) E no mobile (ou DevTools em 360×740).
> Pré-requisito: produção estável (sem 500) — ver Fase 0 no chat.

## 1. Busca e descoberta

| # | Caso | Como testar | Esperado | Status |
|---|------|-------------|----------|--------|
| 1.1 | Autocomplete de origem/destino | Digite "rec", "joa", "gar" | Sugestões com cidade + UF; teclado ↑/↓/Enter funciona | |
| 1.2 | Busca por rota com data | Recife → Caruaru, amanhã | Lista só viagens futuras dessa rota/dia | |
| 1.3 | Busca sem resultados | Rota sem oferta (ex.: Teresina → Pipa) | Estado vazio amigável com CTA, não erro | |
| 1.4 | Filtro por 1 opcional | Marque "Ar-condicionado" | Só viagens que têm o opcional | |
| 1.5 | Filtros combinados (AND) | "Ar" + "Aceita pet" | Só viagens com AMBOS | |
| 1.6 | Filtro por faixa | Marque "Premium" | Só viagens Premium | |
| 1.7 | Slider de preço | Limite em R$ 50 | Nada acima de R$ 50; em R$ 300 mostra tudo | |
| 1.8 | Ordenações | Recomendado / menor preço / melhor avaliação / horário | Ordem muda coerentemente | |
| 1.9 | Rotas populares (landing) | Clique numa rota da home | Cai na busca já filtrada | |
| 1.10 | Card da viagem | Confira um card | Nome+foto+nota+nº avaliações, selo verificado, faixa, horários, carro, lugares, chips de opcionais, preço | |

## 2. Detalhe da viagem

| # | Caso | Como testar | Esperado | Status |
|---|------|-------------|----------|--------|
| 2.1 | Conteúdo completo | Abra qualquer viagem | Trajeto com horários, mapa da rota, ponto de embarque, recado do motorista, carro, opcionais com descrição, avaliações | |
| 2.2 | Breakdown de preço | Barra lateral | Valor do motorista + taxa Trip separados; soma bate | |
| 2.3 | Favoritar deslogado | Clique "Salvar" sem login | Redireciona pro login e volta | |
| 2.4 | Favoritar logado | Salve e remova | Estado alterna; aparece/some em /favoritos | |
| 2.5 | Chat com motorista | "Conversar com..." | Abre conversa; mensagem chega do outro lado (teste com as 2 contas) | |
| 2.6 | Viagem lotada/cancelada | (se houver) | Botão de reserva desabilitado com explicação | |

## 3. Reserva e pagamento

| # | Caso | Como testar | Esperado | Status |
|---|------|-------------|----------|--------|
| 3.1 | Reserva Pix | Reserve 1 assento com Pix | Página da reserva "Aguardando pagamento" + código copia-e-cola | |
| 3.2 | Confirmação Pix | Botão "simular pagamento recebido" | Status vira "Confirmada"; assentos da viagem diminuem | |
| 3.3 | Cartão aprovado | Reserve com cartão comum | Confirmada na hora | |
| 3.4 | Cartão recusado | Cartão final `0002` | Mensagem de recusa; assentos NÃO ficam presos (recarregue a viagem) | |
| 3.5 | Vários assentos | Reserve 2–3 assentos | Total = (preço × N) + taxa; contagem certa | |
| 3.6 | Reserva duplicada | Tente reservar a mesma viagem 2× | Reaproveita a reserva existente (não cobra 2×) | |
| 3.7 | Própria viagem | Logado como motorista, tente reservar viagem própria | Bloqueado com aviso | |
| 3.8 | Link de acompanhamento | Na reserva confirmada, copie o link e abra em anônima | Página pública com rota, placa, motorista — sem pedir login | |

## 4. Cancelamento e reembolso

| # | Caso | Como testar | Esperado | Status |
|---|------|-------------|----------|--------|
| 4.1 | Cancelar com +24h | Reserva de viagem distante | Aviso de reembolso integral; status "Cancelada"; assentos devolvidos | |
| 4.2 | Aviso das janelas | Leia o diálogo de confirmação | Percentual correto pra antecedência (100/50/0) | |
| 4.3 | Cancelamento pelo motorista | Como João, cancele uma viagem com reserva | Passageiro vê "Cancelada pelo motorista"; reembolso integral registrado | |

## 5. Motorista

| # | Caso | Como testar | Esperado | Status |
|---|------|-------------|----------|--------|
| 5.1 | KYC aprovado | Conta nova → "Oferecer carona" → CPF `529.982.247-25` | Aprovado; segue pra cadastro de veículo | |
| 5.2 | KYC recusado | CPF `111.111.111-11` | Recusa com mensagem clara; pode tentar de novo | |
| 5.3 | Cadastro de veículo | Placa Mercosul (ABC1D23) e antiga (ABC-1234) | Ambas aceitas; inválida rejeitada | |
| 5.4 | Publicar viagem | Preencha tudo | Sugestão de faixa de preço aparece ao escolher rota; faixa (Econômico/…) atualiza ao marcar opcionais | |
| 5.5 | Publicação inválida | Data no passado, origem = destino, preço R$ 1 | Erros claros, sem publicar | |
| 5.6 | Viagem publicada | Confira em /buscar | Aparece na busca com os dados certos | |
| 5.7 | Painel | /motorista | Métricas, próximas viagens, reservas recebidas | |
| 5.8 | Concluir viagem | Viagem com departAt no passado | "Marcar como concluída" libera repasse (HELD → RELEASED em /motorista/ganhos) | |
| 5.9 | Ganhos | /motorista/ganhos | Extrato coerente: custódia / liberado / transferido | |

## 6. Avaliações

| # | Caso | Como testar | Esperado | Status |
|---|------|-------------|----------|--------|
| 6.1 | Avaliar como passageiro | Reserva concluída → 5 estrelas + comentário | Salva; média/contagem do motorista atualiza | |
| 6.2 | Avaliar como motorista | Na viagem concluída, avalie o passageiro | Salva; sem avaliar 2× a mesma reserva | |
| 6.3 | Antes de concluir | Tente avaliar reserva confirmada (não concluída) | Bloqueado | |

## 7. Conta e segurança

| # | Caso | Como testar | Esperado | Status |
|---|------|-------------|----------|--------|
| 7.1 | Cadastro | Conta nova, e-mail repetido, senha curta | Sucesso / erros claros | |
| 7.2 | Login/logout | Senha errada, depois certa | Erro claro; login redireciona pro destino original | |
| 7.3 | Contato de segurança | /perfil, salve nome+telefone | Persiste após reload | |
| 7.4 | Rotas protegidas | /minhas-viagens deslogado | Vai pro login e volta após entrar | |
| 7.5 | Acesso indevido | Abra /reserva/CODIGO de outro usuário | 404, não vaza dado | |

## 8. Responsividade e acessibilidade

| # | Caso | Como testar | Esperado | Status |
|---|------|-------------|----------|--------|
| 8.1 | Mobile 360px | Home, busca, detalhe, checkout, painel | Sem scroll horizontal, botões alcançáveis, texto legível | |
| 8.2 | Teclado | Tab pela busca e checkout | Foco visível (anel âmbar), ordem lógica, Enter envia | |
| 8.3 | Zoom 200% | Ctrl+ na busca | Layout não quebra | |
| 8.4 | Datas/moeda | Qualquer tela | Formato brasileiro (R$, dd/mm, fuso Recife) | |

## Bugs encontrados

| # | Tela/fluxo | O que aconteceu | O que era esperado | Print? |
|---|-----------|------------------|--------------------|--------|
| B1 | | | | |
| B2 | | | | |
