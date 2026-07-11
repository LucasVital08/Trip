/**
 * Smoke QA: varre as páginas principais do Trip com Chromium real,
 * coletando erros de console, requests falhas e status HTTP.
 * Também exercita login + páginas autenticadas + fluxo de detalhe.
 */
import { chromium } from "playwright-core";

const BASE = "http://localhost:3000";
const problems = [];

const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } }); // mobile-first
const page = await ctx.newPage();

page.on("console", (msg) => {
  if (msg.type() === "error") problems.push(`[console] ${page.url()} → ${msg.text().slice(0, 200)}`);
});
page.on("pageerror", (err) => problems.push(`[pageerror] ${page.url()} → ${String(err).slice(0, 200)}`));
page.on("requestfailed", (req) => {
  const benign = req.url().includes("favicon") || (req.url().includes("_rsc=") && req.failure()?.errorText === "net::ERR_ABORTED"); // prefetch RSC cancelado = normal
  if (!benign) problems.push(`[reqfail] ${req.url().slice(0, 120)} → ${req.failure()?.errorText}`);
});

async function visit(path, mustContain) {
  const res = await page.goto(BASE + path, { waitUntil: "networkidle", timeout: 30000 });
  const status = res?.status() ?? 0;
  if (status >= 400) problems.push(`[http ${status}] ${path}`);
  if (mustContain) {
    const body = await page.content();
    if (!body.includes(mustContain)) problems.push(`[conteúdo] ${path} não contém "${mustContain}"`);
  }
  // scroll horizontal em mobile?
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  if (overflow > 2) problems.push(`[overflow-x] ${path} → ${overflow}px de scroll horizontal em 390px`);
  console.log(`  ${status} ${path}`);
}

console.log("— páginas públicas (mobile 390px)");
await visit("/", "estrada é melhor");
await visit("/buscar", "viagens");
await visit("/buscar?origemNome=Recife&destinoNome=Caruaru", "Recife");
await visit("/buscar?opcionais=ar-condicionado,aceita-pet", "");
await visit("/como-funciona", "taxa");
await visit("/seguranca", "Verifica");
await visit("/termos", "intermedia");
await visit("/privacidade", "LGPD");
await visit("/entrar", "Entrar");
await visit("/cadastrar", "conta");

// detalhe de uma viagem real
console.log("— detalhe da viagem");
await page.goto(BASE + "/buscar?origemNome=Recife&destinoNome=Caruaru", { waitUntil: "networkidle" });
const tripLink = await page.locator('a[href^="/viagem/"]').first().getAttribute("href");
if (tripLink) {
  await visit(tripLink, "Taxa de serviço");
} else {
  problems.push("[fluxo] nenhum card de viagem em Recife→Caruaru");
}

// login
console.log("— login passageiro");
await page.goto(BASE + "/entrar", { waitUntil: "networkidle" });
await page.fill("#login-email", "passageiro@trip.dev");
await page.fill("#login-password", "trip123");
await page.click('button[type="submit"]:has-text("Entrar")');
await page.waitForURL(BASE + "/", { timeout: 15000 }).catch(() => problems.push("[fluxo] login não redirecionou pra home"));

console.log("— páginas autenticadas");
await visit("/minhas-viagens", "Minhas viagens");
await visit("/favoritos", "Favoritos");
await visit("/mensagens", "Mensagens");
await visit("/perfil", "segurança");
await visit("/motorista/comecar", "renda");

// conversa
const convoLink = await page.goto(BASE + "/mensagens", { waitUntil: "networkidle" }).then(() =>
  page.locator('a[href^="/mensagens/"]').first().getAttribute("href").catch(() => null)
);
if (convoLink) await visit(convoLink, "");

// reserva demo
await page.goto(BASE + "/minhas-viagens", { waitUntil: "networkidle" });
const bookingLink = await page.locator('a[href^="/reserva/"]').first().getAttribute("href").catch(() => null);
if (bookingLink) {
  await visit(bookingLink, "Pagamento");
  const share = await page.locator('code:has-text("/acompanhar/")').first().textContent().catch(() => null);
  if (share) {
    const token = share.trim().split("/acompanhar/")[1];
    const anon = await browser.newContext();
    const anonPage = await anon.newPage();
    const res = await anonPage.goto(BASE + "/acompanhar/" + token, { waitUntil: "networkidle" });
    if ((res?.status() ?? 0) >= 400) problems.push("[http] /acompanhar público falhou");
    else console.log(`  ${res.status()} /acompanhar/<token> (anônimo)`);
    await anon.close();
  } else {
    problems.push("[fluxo] link de acompanhamento não encontrado na reserva");
  }
}

// login motorista + painel
console.log("— login motorista");
const ctx2 = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const p2 = await ctx2.newPage();
p2.on("pageerror", (err) => problems.push(`[pageerror] ${p2.url()} → ${String(err).slice(0, 200)}`));
await p2.goto(BASE + "/entrar", { waitUntil: "networkidle" });
await p2.fill("#login-email", "motorista@trip.dev");
await p2.fill("#login-password", "trip123");
await p2.click('button[type="submit"]:has-text("Entrar")');
await p2.waitForURL(BASE + "/", { timeout: 15000 }).catch(() => {});
for (const path of ["/motorista", "/motorista/publicar", "/motorista/veiculos", "/motorista/ganhos"]) {
  const res = await p2.goto(BASE + path, { waitUntil: "networkidle" });
  const status = res?.status() ?? 0;
  if (status >= 400) problems.push(`[http ${status}] ${path} (motorista)`);
  console.log(`  ${status} ${path}`);
}

await browser.close();

console.log("\n════════ RESULTADO ════════");
if (problems.length === 0) {
  console.log("✓ Smoke limpo: nenhum erro de console, request falha, overflow ou HTTP >= 400.");
} else {
  console.log(`✗ ${problems.length} problema(s):`);
  for (const p of problems) console.log("  " + p);
  process.exitCode = 1;
}
