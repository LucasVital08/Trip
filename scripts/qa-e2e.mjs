/**
 * QA E2E completo do Trip — executa o QA-CHECKLIST.md de ponta a ponta:
 * navegador real (Chromium/Playwright) para os fluxos + Prisma para
 * verificar os efeitos no banco (assentos, payouts, reembolsos, agregados).
 *
 * Pré-requisitos: banco seedado (pnpm db:seed) e app rodando (pnpm start).
 * Uso: node scripts/qa-e2e.mjs
 *
 * ATENÇÃO: o script MUTA o banco local (reservas, cancelamentos, novo
 * motorista, conclusão de viagem). Rode pnpm db:seed antes de repetir.
 */
import { chromium } from "playwright-core";
import { PrismaClient } from "@prisma/client";

const BASE = "http://localhost:3000";
const prisma = new PrismaClient();
const results = [];

function check(id, desc, cond, extra = "") {
  results.push({ id, desc, ok: Boolean(cond), extra });
  console.log(`${cond ? "✅" : "❌"} ${id} ${desc}${!cond && extra ? ` — ${extra}` : ""}`);
}

function parseBRL(text) {
  const m = text.replace(/ /g, " ").match(/R\$\s?([\d.]+(?:,\d{2})?)/);
  if (!m) return null;
  return Math.round(Number(m[1].replace(/\./g, "").replace(",", ".")) * 100);
}

const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });

async function newSession(viewport = { width: 1280, height: 800 }) {
  const ctx = await browser.newContext({ viewport });
  const page = await ctx.newPage();
  page.setDefaultTimeout(20000);
  return { ctx, page };
}

async function login(page, email) {
  await page.goto(`${BASE}/entrar`);
  await page.fill("#login-email", email);
  await page.fill("#login-password", "trip123");
  await page.click('button[type="submit"]:has-text("Entrar")');
  await page.waitForURL(`${BASE}/`);
}

// ════════════════ dados de apoio ════════════════
const now = new Date();
const joao = await prisma.user.findUniqueOrThrow({ where: { email: "motorista@trip.dev" } });
const marina = await prisma.user.findUniqueOrThrow({ where: { email: "passageiro@trip.dev" } });
const bruna = await prisma.user.findUniqueOrThrow({ where: { email: "bruna@trip.dev" } });

// viagens-alvo (todas com folga de antecedência)
const in48h = new Date(now.getTime() + 48 * 3600_000);
const [tripPix, tripCard, tripDecl, tripDriverCancel] = await prisma.trip.findMany({
  where: { status: "PUBLISHED", departAt: { gt: in48h }, seatsAvailable: { gte: 2 }, driverId: { not: bruna.id } },
  orderBy: { departAt: "asc" },
  take: 4,
});

// ════════════════ 1. Busca e descoberta (anônimo, mobile 390px) ════════════════
console.log("\n— 1. Busca e descoberta");
{
  const { ctx, page } = await newSession({ width: 390, height: 844 });

  // 1.1 autocomplete
  await page.goto(`${BASE}/buscar`);
  await page.getByLabel("Saindo de").fill("rec");
  const opt = page.locator('[role="option"]', { hasText: "Recife" }).first();
  await opt.waitFor({ timeout: 8000 }).catch(() => {});
  check("1.1", "Autocomplete sugere Recife ao digitar 'rec'", await opt.isVisible().catch(() => false));
  await opt.click();

  await page.getByLabel("Indo para").fill("car");
  const opt2 = page.locator('[role="option"]', { hasText: "Caruaru" }).first();
  await opt2.click();
  await Promise.all([
    page.waitForURL(/buscar\?origem/, { timeout: 30000 }),
    page.click('button:has-text("Buscar")'),
  ]);

  // 1.2 resultados da rota
  const cards = page.locator('a[href^="/viagem/"]');
  const n = await cards.count();
  let allMatch = n > 0;
  for (let i = 0; i < n; i++) {
    const t = await cards.nth(i).getAttribute("aria-label");
    if (!t?.includes("Recife para Caruaru")) allMatch = false;
  }
  check("1.2", `Busca Recife→Caruaru retorna só a rota (${n} cards)`, allMatch);

  // 1.3 sem resultados
  await page.goto(`${BASE}/buscar?origemNome=Teresina&destinoNome=Pipa`);
  check("1.3", "Rota sem oferta mostra estado vazio amigável", await page.locator("text=Nenhuma viagem").isVisible());

  // 1.5 filtros AND — compara contagem da UI com o banco
  await page.goto(`${BASE}/buscar?opcionais=ar-condicionado,aceita-pet`);
  const uiCount = await page.locator("article").count();
  const dbCount = await prisma.trip.count({
    where: {
      status: "PUBLISHED",
      seatsAvailable: { gt: 0 },
      departAt: { gt: new Date() },
      AND: [
        { amenities: { some: { amenity: { slug: "ar-condicionado" } } } },
        { amenities: { some: { amenity: { slug: "aceita-pet" } } } },
      ],
    },
  });
  check("1.5", `Filtro AND (ar + pet): UI=${uiCount} = banco=${dbCount}`, uiCount === Math.min(dbCount, 60));

  // 1.6 faixa Premium
  await page.goto(`${BASE}/buscar?faixa=PREMIUM`);
  const premiumCards = await page.locator("article").count();
  const premiumBadges = await page.locator("article", { hasText: "Premium" }).count();
  const premiumDb = await prisma.trip.count({
    where: { status: "PUBLISHED", seatsAvailable: { gt: 0 }, departAt: { gt: new Date() }, tier: "PREMIUM" },
  });
  check("1.6", `Filtro Premium: ${premiumCards} cards, todos Premium, banco=${premiumDb}`, premiumCards === premiumDb && premiumBadges === premiumCards);

  // 1.7 teto de preço
  await page.goto(`${BASE}/buscar?precoMax=50`);
  const priceTexts = await page.locator("article p.text-2xl").allTextContents();
  const okPrices = priceTexts.length > 0 && priceTexts.every((t) => (parseBRL(t) ?? 99999) <= 5000);
  check("1.7", `Slider R$50: todos os ${priceTexts.length} preços ≤ R$50`, okPrices, priceTexts.join(", "));

  // 1.8 ordenação por preço
  await page.goto(`${BASE}/buscar?ordenar=preco`);
  const sorted = (await page.locator("article p.text-2xl").allTextContents()).map(parseBRL);
  const isSorted = sorted.every((v, i) => i === 0 || v >= sorted[i - 1]);
  check("1.8", "Ordenar por menor preço: lista não-decrescente", isSorted, sorted.slice(0, 6).join(","));

  // 1.10 conteúdo do card
  await page.goto(`${BASE}/buscar?origemNome=Recife&destinoNome=Caruaru`);
  const firstCard = page.locator("article").first();
  const cardText = await firstCard.textContent();
  const hasAll = ["R$", "lugar"].every((s) => cardText.includes(s)) && /\d{2}:\d{2}/.test(cardText);
  check("1.10", "Card mostra horários, preço, lugares, motorista", hasAll && (await firstCard.locator('span:has-text("Verificado")').count()) > 0);

  await ctx.close();
}

// ════════════════ 2. Detalhe da viagem ════════════════
console.log("\n— 2. Detalhe da viagem");
{
  const { ctx, page } = await newSession();
  await page.goto(`${BASE}/viagem/${tripPix.id}`);

  // 2.1 conteúdo
  const content = await page.content();
  check(
    "2.1",
    "Detalhe tem trajeto, mapa, embarque, carro, opcionais, avaliações",
    ["Trajeto", "Quem dirige", "O carro e a experiência", "Embarque:"].every((s) => content.includes(s)) &&
      (await page.locator('svg[role="img"]').count()) > 0
  );

  // 2.2 breakdown de preço
  const aside = page.locator("aside");
  const asideText = await aside.textContent();
  const subtotal = tripPix.pricePerSeatCents;
  const fee = Math.round(subtotal * 0.12);
  const total = subtotal + fee;
  const mathOk = [subtotal, fee, total].every((v) => {
    const formatted = (v / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
    return asideText.replace(/ /g, " ").includes(formatted.replace(/ /g, " "));
  });
  check("2.2", `Breakdown: ${subtotal / 100} + ${fee / 100} (12%) = ${total / 100} visível`, mathOk);

  // 2.3 favoritar deslogado redireciona pro login
  await page.click('button:has-text("Salvar")');
  await page.waitForURL(/\/entrar/);
  check("2.3", "Favoritar deslogado → login com callback", page.url().includes("callbackUrl"));
  await ctx.close();
}

// ════════════════ 3. Reserva e pagamento ════════════════
console.log("\n— 3. Reserva e pagamento (bruna)");
const brunaSession = await newSession();
let pixBookingCode = null;
{
  const { page } = brunaSession;
  await login(page, "bruna@trip.dev");

  // 3.1 reserva Pix com 2 assentos
  const seatsBefore = tripPix.seatsAvailable;
  await page.goto(`${BASE}/viagem/${tripPix.id}/reservar`);
  await page.click('button[aria-label="Mais um assento"]');
  await page.click('button:has-text("Gerar Pix e reservar")');
  await page.waitForURL(/\/reserva\/TRP-/);
  pixBookingCode = page.url().split("/reserva/")[1];
  const pixVisible = await page.locator("code", { hasText: "BR.GOV.BCB.PIX" }).isVisible();
  check("3.1", `Reserva Pix criada (${pixBookingCode}), aguardando pagamento + copia-e-cola`, pixVisible && (await page.content()).includes("Aguardando pagamento"));

  let dbTrip = await prisma.trip.findUniqueOrThrow({ where: { id: tripPix.id } });
  check("3.1b", `Assentos decrementados atomicamente (${seatsBefore}→${dbTrip.seatsAvailable})`, dbTrip.seatsAvailable === seatsBefore - 2);

  // 3.2 simular confirmação via webhook
  await page.click('button:has-text("simular pagamento recebido")');
  await page.waitForTimeout(2500);
  await page.reload();
  const confirmed = (await page.content()).includes("Confirmada");
  const dbBooking = await prisma.booking.findUnique({ where: { code: pixBookingCode }, include: { payment: true, payout: true } });
  check(
    "3.2",
    "Pix confirmado via webhook: status, pagamento PAID e payout HELD",
    confirmed && dbBooking.status === "CONFIRMED" && dbBooking.payment.status === "PAID" && dbBooking.payout?.status === "HELD" && dbBooking.payout.amountCents === dbBooking.subtotalCents
  );

  // 3.8 link de acompanhamento público
  const shareCode = await page.locator('code:has-text("/acompanhar/")').first().textContent();
  const token = shareCode.trim().split("/acompanhar/")[1];
  const anon = await browser.newContext();
  const anonPage = await anon.newPage();
  const shareRes = await anonPage.goto(`${BASE}/acompanhar/${token}`);
  const shareContent = await anonPage.content();
  check("3.8", "Link público de acompanhamento: rota + placa sem login", shareRes.status() === 200 && shareContent.includes(tripPix.originCity) && shareContent.includes("Placa"));
  await anon.close();

  // 3.6 reserva duplicada reaproveita a existente
  await page.goto(`${BASE}/viagem/${tripPix.id}/reservar`);
  await page.click('button:has-text("Gerar Pix e reservar")');
  await page.waitForURL(/\/reserva\/TRP-/);
  check("3.6", "Reserva duplicada redireciona pra existente (não cobra 2×)", page.url().includes(pixBookingCode));

  // 3.3 cartão aprovado (1 assento em outra viagem)
  await page.goto(`${BASE}/viagem/${tripCard.id}/reservar`);
  await page.click('button:has-text("Cartão de crédito")');
  await page.fill("#card-number", "4242 4242 4242 4242");
  await page.fill("#card-exp", "12/29");
  await page.fill("#card-cvc", "123");
  await page.click('button:has-text("Pagar")');
  await page.waitForURL(/\/reserva\/TRP-/);
  const cardCode = page.url().split("/reserva/")[1];
  const cardBooking = await prisma.booking.findUnique({ where: { code: cardCode }, include: { payment: true, payout: true } });
  check("3.3", `Cartão aprovado na hora (${cardCode})`, (await page.content()).includes("Confirmada") && cardBooking.payment.status === "PAID" && cardBooking.payment.cardLast4 === "4242" && cardBooking.payout?.status === "HELD");

  // 3.4 cartão recusado devolve assentos
  const declBefore = (await prisma.trip.findUniqueOrThrow({ where: { id: tripDecl.id } })).seatsAvailable;
  await page.goto(`${BASE}/viagem/${tripDecl.id}/reservar`);
  await page.click('button:has-text("Cartão de crédito")');
  await page.fill("#card-number", "4242 4242 4242 0002");
  await page.fill("#card-exp", "12/29");
  await page.fill("#card-cvc", "123");
  await page.click('button:has-text("Pagar")');
  await page.waitForSelector('p[role="alert"]:has-text("recusado")');
  await page.waitForTimeout(400);
  const declAfter = (await prisma.trip.findUniqueOrThrow({ where: { id: tripDecl.id } })).seatsAvailable;
  check("3.4", "Cartão 0002 recusado: erro claro + assentos devolvidos", declAfter === declBefore, `assentos ${declBefore}→${declAfter}`);
}

// 3.7 motorista não reserva a própria viagem
{
  const { ctx, page } = await newSession();
  await login(page, "motorista@trip.dev");
  const own = await prisma.trip.findFirst({ where: { driverId: joao.id, status: "PUBLISHED", departAt: { gt: now } } });
  await page.goto(`${BASE}/viagem/${own.id}/reservar`);
  await page.waitForURL(/\/motorista\/viagens\//);
  check("3.7", "Motorista tentando reservar a própria viagem → gestão", true);
  await ctx.close();
}

// ════════════════ 4. Cancelamento e reembolso ════════════════
console.log("\n— 4. Cancelamento e reembolso");
{
  const { page } = brunaSession;
  // 4.1 cancelar com +24h → reembolso integral
  await page.goto(`${BASE}/reserva/${pixBookingCode}`);
  const seatsBefore = (await prisma.trip.findUniqueOrThrow({ where: { id: tripPix.id } })).seatsAvailable;
  await page.click('button:has-text("Cancelar reserva")');
  const refundNotice = await page.locator("text=reembolso integral").isVisible();
  await page.click('button:has-text("Confirmar cancelamento")');
  await page.waitForSelector("text=Cancelada por você");
  const cancelled = await prisma.booking.findUnique({ where: { code: pixBookingCode }, include: { payment: true, payout: true } });
  const seatsAfter = (await prisma.trip.findUniqueOrThrow({ where: { id: tripPix.id } })).seatsAvailable;
  check(
    "4.1",
    "Cancelamento +24h: aviso integral, REFUNDED total, payout REVERSED, assentos devolvidos",
    refundNotice &&
      cancelled.status === "CANCELLED_BY_PASSENGER" &&
      cancelled.payment.status === "REFUNDED" &&
      cancelled.payment.refundCents === cancelled.totalCents &&
      cancelled.payout.status === "REVERSED" &&
      seatsAfter === seatsBefore + 2
  );
}

// 4.3 cancelamento pelo motorista reembolsa todo mundo
{
  const { page } = brunaSession; // bruna reserva a viagem que será cancelada
  await page.goto(`${BASE}/viagem/${tripDriverCancel.id}/reservar`);
  await page.click('button:has-text("Cartão de crédito")');
  await page.fill("#card-number", "5555 4444 3333 1111");
  await page.fill("#card-exp", "11/28");
  await page.fill("#card-cvc", "321");
  await page.click('button:has-text("Pagar")');
  await page.waitForURL(/\/reserva\/TRP-/);
  const victimCode = page.url().split("/reserva/")[1];

  const { ctx, page: drv } = await newSession();
  const cancelDriver = await prisma.user.findUniqueOrThrow({ where: { id: tripDriverCancel.driverId } });
  await login(drv, cancelDriver.email);
  drv.on("dialog", (d) => d.accept());
  await drv.goto(`${BASE}/motorista/viagens/${tripDriverCancel.id}`);
  await drv.click('button:has-text("Cancelar viagem")');
  await drv.waitForTimeout(2500);
  const victim = await prisma.booking.findUnique({ where: { code: victimCode }, include: { payment: true, payout: true } });
  const cancelledTrip = await prisma.trip.findUniqueOrThrow({ where: { id: tripDriverCancel.id } });
  check(
    "4.3",
    "Motorista cancela: viagem CANCELLED, reserva CANCELLED_BY_DRIVER, reembolso integral, payout REVERSED",
    cancelledTrip.status === "CANCELLED" &&
      victim.status === "CANCELLED_BY_DRIVER" &&
      victim.payment.status === "REFUNDED" &&
      victim.payment.refundCents === victim.totalCents &&
      victim.payout?.status === "REVERSED"
  );
  await ctx.close();
}

// ════════════════ 5. Motorista: KYC, veículo, publicação ════════════════
console.log("\n— 5. Onboarding e publicação de viagem");
const QA_EMAIL = `qa.driver.${Date.now().toString(36)}@trip.dev`;
{
  const { ctx, page } = await newSession();
  // cadastro (7.1 parcial)
  await page.goto(`${BASE}/cadastrar`);
  await page.fill("#reg-name", "Quality Assurance da Silva");
  await page.fill("#reg-email", QA_EMAIL);
  await page.fill("#reg-password", "trip123");
  await page.click('button:has-text("Criar conta")');
  await page.waitForURL(`${BASE}/`);
  check("7.1", "Cadastro de conta nova funciona e já loga", true);

  // 5.2 KYC recusado (CPF inválido)
  await page.goto(`${BASE}/motorista/comecar`);
  await page.fill("#drv-cpf", "111.111.111-11");
  await page.fill("#drv-phone", "(81) 99999-1234");
  await page.fill("#drv-cnh", "12345678901");
  await page.fill("#drv-exp", "2030-06-30");
  await page.click('button:has-text("Enviar verificação")');
  await page.waitForSelector('p[role="alert"]:has-text("recusada")');
  check("5.2", "KYC com CPF inválido é recusado com mensagem clara", true);

  // 5.1 KYC aprovado (CPF válido)
  await page.fill("#drv-cpf", "529.982.247-25");
  await page.click('button:has-text("Enviar verificação")');
  await page.waitForURL(/\/motorista\/veiculos/);
  const qaUser = await prisma.user.findUniqueOrThrow({ where: { email: QA_EMAIL }, include: { driverProfile: true } });
  check("5.1", "KYC com CPF válido aprova e segue pro veículo", qaUser.identityStatus === "VERIFIED" && qaUser.driverProfile?.status === "VERIFIED");

  // 5.3 placa inválida rejeitada, válida aceita
  await page.fill("#veh-brand", "Fiat");
  await page.fill("#veh-model", "Argo");
  await page.fill("#veh-year", "2021");
  await page.fill("#veh-color", "Prata");
  await page.fill("#veh-plate", "AB12");
  await page.click('button:has-text("Salvar veículo")');
  await page.waitForSelector('p[role="alert"]:has-text("Placa")');
  const plateErr = true;
  await page.fill("#veh-plate", "QAT1B23");
  await page.click('button:has-text("Salvar veículo")');
  await page.waitForSelector("text=Fiat Argo 2021");
  check("5.3", "Placa inválida rejeitada; Mercosul aceita; carro listado", plateErr);

  // 5.5 publicação inválida: origem = destino
  await page.goto(`${BASE}/motorista/publicar`);
  await page.getByLabel("Saindo de").fill("rec");
  await page.locator('[role="option"]', { hasText: "Recife" }).first().click();
  await page.getByLabel("Indo para").fill("rec");
  await page.locator('[role="option"]', { hasText: "Recife" }).first().click();
  await page.fill("#pub-meeting", "Parque do Derby, quiosque");
  await page.getByLabel("Valor por assento (R$)").fill("48");
  await page.click('button:has-text("Publicar viagem")');
  await page.waitForSelector('p[role="alert"]:has-text("diferentes")');
  check("5.5a", "Origem = destino é bloqueado", true);

  // 5.5b preço abaixo do mínimo
  await page.getByLabel("Indo para").fill("gar");
  await page.locator('[role="option"]', { hasText: "Garanhuns" }).first().click();
  await page.getByLabel("Valor por assento (R$)").fill("1");
  await page.click('button:has-text("Publicar viagem")');
  await page.waitForSelector("text=Preço por assento deve ficar");
  check("5.5b", "Preço abaixo do mínimo (R$10) é bloqueado", true);

  // 5.4 publicação válida com sugestão de preço e faixa dinâmica
  const suggestion = await page.locator("text=Sugestão para esta rota").isVisible();
  const faixaBefore = await page.locator("text=Faixa resultante:").textContent();
  await page.click("text=Ar-condicionado");
  await page.click("text=Wi-Fi a bordo");
  await page.click("text=Água & bala");
  const faixaAfter = await page.locator("text=Faixa resultante:").textContent();
  check("5.4a", `Sugestão de preço visível; faixa muda com opcionais (${faixaBefore.trim()} → ${faixaAfter.trim()})`, suggestion && faixaBefore !== faixaAfter);

  await page.getByLabel("Valor por assento (R$)").fill("48");
  await page.fill("#pub-notes", "Viagem de teste do QA — estrada tranquila.");
  await page.click('button:has-text("Publicar viagem")');
  await page.waitForURL(/\/viagem\/.+publicada=1/);
  const newTripId = page.url().split("/viagem/")[1].split("?")[0];
  const newTrip = await prisma.trip.findUniqueOrThrow({ where: { id: newTripId }, include: { amenities: true } });
  check("5.4b", `Viagem publicada (${newTrip.originCity}→${newTrip.destCity}, ${newTrip.tier}, ${newTrip.amenities.length} opcionais)`, newTrip.status === "PUBLISHED" && newTrip.pricePerSeatCents === 4800 && newTrip.amenities.length >= 3);

  // 5.6 aparece na busca
  await page.goto(`${BASE}/buscar?origemNome=Recife&destinoNome=Garanhuns`);
  check("5.6", "Viagem recém-publicada aparece na busca", (await page.locator(`a[href="/viagem/${newTripId}"]`).count()) > 0);
  await ctx.close();
}

// ════════════════ 5.8 Conclusão de viagem + 6. Avaliações ════════════════
console.log("\n— 5.8/6. Conclusão, repasse e avaliação mútua");
{
  // move a viagem demo (com a reserva confirmada da Marina) para o passado
  const demoBooking = await prisma.booking.findFirstOrThrow({
    where: { passengerId: marina.id, status: "CONFIRMED" },
    include: { trip: true },
  });
  await prisma.trip.update({
    where: { id: demoBooking.tripId },
    data: { departAt: new Date(now.getTime() - 3 * 3600_000), arriveEstAt: new Date(now.getTime() - 1 * 3600_000) },
  });

  const { ctx, page } = await newSession();
  await login(page, "motorista@trip.dev");
  await page.goto(`${BASE}/motorista`);
  const hasPending = await page.locator("text=Aguardando conclusão").isVisible();
  await page.locator('button:has-text("Marcar como concluída")').first().click();
  await page.waitForTimeout(2500);
  const doneBooking = await prisma.booking.findUniqueOrThrow({ where: { id: demoBooking.id }, include: { payout: true, trip: true } });
  check(
    "5.8",
    "Concluir viagem: booking COMPLETED e payout HELD → RELEASED",
    hasPending && doneBooking.trip.status === "COMPLETED" && doneBooking.status === "COMPLETED" && doneBooking.payout?.status === "RELEASED" && doneBooking.payout.releasedAt !== null
  );

  // 5.9 extrato
  await page.goto(`${BASE}/motorista/ganhos`);
  check("5.9", "Extrato de ganhos com custódia/liberado/transferido", (await page.locator("text=Liberado").count()) > 0 && (await page.locator("table tbody tr").count()) > 0);

  // 6.2 motorista avalia passageiro
  const cntBefore = (await prisma.user.findUniqueOrThrow({ where: { id: marina.id } })).passengerRatingCnt;
  await page.goto(`${BASE}/motorista/viagens/${demoBooking.tripId}`);
  await page.locator('button[aria-label="5 estrelas"]').first().click();
  await page.fill('textarea[name="comment"]', "Passageira pontual, viagem tranquila. (QA)");
  await page.click('button:has-text("Enviar avaliação")');
  await page.waitForTimeout(2500);
  const cntAfter = (await prisma.user.findUniqueOrThrow({ where: { id: marina.id } })).passengerRatingCnt;
  check("6.2", `Motorista avalia passageiro; agregado ${cntBefore}→${cntAfter}`, cntAfter === cntBefore + 1);
  await ctx.close();

  // 6.1 passageira avalia motorista
  const { ctx: mc, page: mp } = await newSession({ width: 390, height: 844 });
  await login(mp, "passageiro@trip.dev");
  const drvBefore = await prisma.user.findUniqueOrThrow({ where: { id: joao.id } });
  await mp.goto(`${BASE}/reserva/${demoBooking.code}`);
  await mp.locator('button[aria-label="4 estrelas"]').first().click();
  await mp.fill('textarea[name="comment"]', "Boa viagem, chegamos no horário. (QA)");
  await mp.click('button:has-text("Enviar avaliação")');
  await mp.waitForSelector("text=Avaliação enviada");
  const drvAfter = await prisma.user.findUniqueOrThrow({ where: { id: joao.id } });
  check("6.1", `Passageira avalia motorista; contagem ${drvBefore.driverRatingCount}→${drvAfter.driverRatingCount}, média recalculada`, drvAfter.driverRatingCount === drvBefore.driverRatingCount + 1 && Math.abs(drvAfter.driverRatingAvg - (drvBefore.driverRatingAvg * drvBefore.driverRatingCount + 4) / (drvBefore.driverRatingCount + 1)) < 0.01);

  // 6.x formulário some após avaliar (sem duplicar)
  await mp.reload();
  check("6.3", "Reserva avaliada não mostra o formulário de novo", (await mp.locator('button:has-text("Enviar avaliação")').count()) === 0);

  // ── 7. chat: marina manda, joão recebe com badge de não lida
  await mp.goto(`${BASE}/mensagens`);
  await mp.locator('a[href^="/mensagens/"]').first().click();
  await mp.fill('textarea[name="body"]', "Mensagem de teste do QA 🚗");
  await mp.click('button[aria-label="Enviar mensagem"]');
  await mp.waitForSelector("text=Mensagem de teste do QA");
  check("2.5a", "Mensagem enviada aparece no chat", true);
  await mc.close();

  const { ctx: jc, page: jp } = await newSession();
  await login(jp, "motorista@trip.dev");
  await jp.goto(`${BASE}/mensagens`);
  const unreadBadge = await jp.locator('span.bg-amber-deep:has-text("1")').count();
  await jp.locator('a[href^="/mensagens/"]').first().click();
  const received = await jp.locator("text=Mensagem de teste do QA").isVisible();
  check("2.5b", "Outro lado recebe com badge de não lida e lê a mensagem", unreadBadge > 0 && received);
  await jc.close();
}

// ════════════════ 7. Controle de acesso ════════════════
console.log("\n— 7. Conta e controle de acesso");
{
  // 7.5 reserva de outro usuário → 404
  const someMarinaBooking = await prisma.booking.findFirstOrThrow({ where: { passengerId: marina.id } });
  const { page } = brunaSession;
  const res = await page.goto(`${BASE}/reserva/${someMarinaBooking.code}`);
  check("7.5", "Reserva de outro usuário retorna 404 (sem vazar dados)", res.status() === 404);

  // 7.4 rota protegida deslogado → login → volta ao destino
  const { ctx, page: anon2 } = await newSession();
  await anon2.goto(`${BASE}/minhas-viagens`);
  await anon2.waitForURL(/\/entrar/);
  await anon2.fill("#login-email", "passageiro@trip.dev");
  await anon2.fill("#login-password", "trip123");
  await anon2.keyboard.press("Enter"); // 8.2: submit por teclado
  await anon2.waitForURL(/minhas-viagens/);
  check("7.4", "Rota protegida → login (com Enter) → volta ao destino original", true);

  // 7.2 senha errada
  const { ctx: c3, page: p3 } = await newSession();
  await p3.goto(`${BASE}/entrar`);
  await p3.fill("#login-email", "passageiro@trip.dev");
  await p3.fill("#login-password", "senhaerrada");
  await p3.click('button:has-text("Entrar")');
  await p3.waitForSelector('p[role="alert"]:has-text("incorretos")');
  check("7.2", "Senha errada mostra erro claro sem logar", true);
  await c3.close();

  // 7.3 contato de segurança persiste
  await anon2.goto(`${BASE}/perfil`);
  await anon2.fill("#safety-name", "Dona Célia (mãe)");
  await anon2.fill("#safety-phone", "(81) 98888-7766");
  await anon2.click('button:has-text("Salvar contato")');
  await anon2.waitForSelector("text=Contato de segurança salvo");
  await anon2.reload();
  check("7.3", "Contato de segurança salva e persiste", (await anon2.locator("#safety-name").inputValue()) === "Dona Célia (mãe)");
  await ctx.close();
}

// ════════════════ resumo ════════════════
await brunaSession.ctx.close();
await browser.close();
await prisma.$disconnect();

const passed = results.filter((r) => r.ok).length;
console.log("\n════════ RESULTADO QA ════════");
console.log(`${passed}/${results.length} casos passaram`);
for (const r of results.filter((x) => !x.ok)) console.log(`  ❌ ${r.id} ${r.desc} ${r.extra}`);
process.exitCode = passed === results.length ? 0 : 1;
