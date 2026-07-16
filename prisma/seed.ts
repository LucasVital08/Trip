/**
 * Seed do Trip — dados realistas de todo o Brasil para navegar de imediato.
 *
 * Contas demo (senha de todas: trip123):
 *   passageiro@trip.dev — passageira (Marina)
 *   motorista@trip.dev  — João reserva como passageiro e também publica viagens
 *
 * Não existe "tipo de conta": todo usuário pode reservar. Ao concluir KYC e
 * cadastrar um veículo, a mesma conta também passa a oferecer caronas.
 */
import { PrismaClient, VehicleCategory } from "@prisma/client";
import { hashSync } from "bcryptjs";
import { deriveTier } from "../src/lib/tier";
import { computeBookingPrice } from "../src/lib/pricing";
import {
  estimateDurationMin,
  estimateRoadDistanceKm,
  haversineKm,
} from "../src/lib/geo";
import { generateBookingCode, generateShareToken } from "../src/lib/booking-code";

const prisma = new PrismaClient();
const PASSWORD_HASH = hashSync("trip123", 10);

// ─── Cidades ────────────────────────────────────────────────────────────────
const CITIES = [
  { name: "Recife", state: "PE", slug: "recife", lat: -8.0476, lng: -34.877 },
  { name: "Olinda", state: "PE", slug: "olinda", lat: -8.0089, lng: -34.8553 },
  { name: "Caruaru", state: "PE", slug: "caruaru", lat: -8.2835, lng: -35.976 },
  { name: "Garanhuns", state: "PE", slug: "garanhuns", lat: -8.8903, lng: -36.4928 },
  { name: "Petrolina", state: "PE", slug: "petrolina", lat: -9.3891, lng: -40.5031 },
  { name: "Porto de Galinhas", state: "PE", slug: "porto-de-galinhas", lat: -8.5045, lng: -35.0076 },
  { name: "João Pessoa", state: "PB", slug: "joao-pessoa", lat: -7.1195, lng: -34.845 },
  { name: "Campina Grande", state: "PB", slug: "campina-grande", lat: -7.2306, lng: -35.8811 },
  { name: "Natal", state: "RN", slug: "natal", lat: -5.7945, lng: -35.211 },
  { name: "Mossoró", state: "RN", slug: "mossoro", lat: -5.1878, lng: -37.3442 },
  { name: "Pipa", state: "RN", slug: "pipa", lat: -6.2283, lng: -35.0458 },
  { name: "Fortaleza", state: "CE", slug: "fortaleza", lat: -3.7172, lng: -38.5433 },
  { name: "Juazeiro do Norte", state: "CE", slug: "juazeiro-do-norte", lat: -7.2131, lng: -39.3153 },
  { name: "Maceió", state: "AL", slug: "maceio", lat: -9.6499, lng: -35.7089 },
  { name: "Arapiraca", state: "AL", slug: "arapiraca", lat: -9.7519, lng: -36.6608 },
  { name: "Aracaju", state: "SE", slug: "aracaju", lat: -10.9095, lng: -37.0748 },
  { name: "Salvador", state: "BA", slug: "salvador", lat: -12.9714, lng: -38.5014 },
  { name: "Feira de Santana", state: "BA", slug: "feira-de-santana", lat: -12.2664, lng: -38.9663 },
  { name: "Teresina", state: "PI", slug: "teresina", lat: -5.0892, lng: -42.8016 },
  { name: "São Luís", state: "MA", slug: "sao-luis", lat: -2.5307, lng: -44.3068 },
  { name: "São Paulo", state: "SP", slug: "sao-paulo", lat: -23.5505, lng: -46.6333 },
  { name: "Campinas", state: "SP", slug: "campinas", lat: -22.9099, lng: -47.0626 },
  { name: "Santos", state: "SP", slug: "santos", lat: -23.9608, lng: -46.3336 },
  { name: "Ribeirão Preto", state: "SP", slug: "ribeirao-preto", lat: -21.1775, lng: -47.8103 },
  { name: "São José dos Campos", state: "SP", slug: "sao-jose-dos-campos", lat: -23.1896, lng: -45.8841 },
  { name: "Rio de Janeiro", state: "RJ", slug: "rio-de-janeiro", lat: -22.9068, lng: -43.1729 },
  { name: "Niterói", state: "RJ", slug: "niteroi", lat: -22.8833, lng: -43.1036 },
  { name: "Campos dos Goytacazes", state: "RJ", slug: "campos-dos-goytacazes", lat: -21.7622, lng: -41.3181 },
  { name: "Belo Horizonte", state: "MG", slug: "belo-horizonte", lat: -19.9167, lng: -43.9345 },
  { name: "Uberlândia", state: "MG", slug: "uberlandia", lat: -18.9186, lng: -48.2772 },
  { name: "Juiz de Fora", state: "MG", slug: "juiz-de-fora", lat: -21.7642, lng: -43.3503 },
  { name: "Vitória", state: "ES", slug: "vitoria", lat: -20.3155, lng: -40.3128 },
  { name: "Curitiba", state: "PR", slug: "curitiba", lat: -25.4284, lng: -49.2733 },
  { name: "Londrina", state: "PR", slug: "londrina", lat: -23.3045, lng: -51.1696 },
  { name: "Foz do Iguaçu", state: "PR", slug: "foz-do-iguacu", lat: -25.5163, lng: -54.5854 },
  { name: "Florianópolis", state: "SC", slug: "florianopolis", lat: -27.5949, lng: -48.5482 },
  { name: "Joinville", state: "SC", slug: "joinville", lat: -26.3044, lng: -48.8487 },
  { name: "Balneário Camboriú", state: "SC", slug: "balneario-camboriu", lat: -26.9926, lng: -48.6349 },
  { name: "Porto Alegre", state: "RS", slug: "porto-alegre", lat: -30.0346, lng: -51.2177 },
  { name: "Caxias do Sul", state: "RS", slug: "caxias-do-sul", lat: -29.1678, lng: -51.1794 },
  { name: "Pelotas", state: "RS", slug: "pelotas", lat: -31.7654, lng: -52.3376 },
  { name: "Brasília", state: "DF", slug: "brasilia", lat: -15.7939, lng: -47.8828 },
  { name: "Goiânia", state: "GO", slug: "goiania", lat: -16.6869, lng: -49.2648 },
  { name: "Cuiabá", state: "MT", slug: "cuiaba", lat: -15.6014, lng: -56.0979 },
  { name: "Campo Grande", state: "MS", slug: "campo-grande", lat: -20.4697, lng: -54.6201 },
  { name: "Belém", state: "PA", slug: "belem", lat: -1.4558, lng: -48.4902 },
  { name: "Manaus", state: "AM", slug: "manaus", lat: -3.1190, lng: -60.0217 },
  { name: "Palmas", state: "TO", slug: "palmas", lat: -10.1842, lng: -48.3336 },
  { name: "Porto Seguro", state: "BA", slug: "porto-seguro", lat: -16.4497, lng: -39.0647 },
];

// ─── Catálogo de opcionais ──────────────────────────────────────────────────
// tierWeight: opcionais de conforto pesam na derivação da faixa;
// preferências de convivência (silêncio, papo, pet, não fumante) pesam 0.
const AMENITIES = [
  { slug: "ar-condicionado", label: "Ar-condicionado", icon: "snowflake", tierWeight: 2, sortOrder: 1, description: "Climatização ligada durante toda a viagem." },
  { slug: "agua-cortesia", label: "Água & bala", icon: "droplet", tierWeight: 1, sortOrder: 2, description: "Cortesias a bordo: água gelada e balinha." },
  { slug: "musica", label: "Playlist a bordo", icon: "music", tierWeight: 1, sortOrder: 3, description: "Som bom na estrada — pode sugerir a playlist." },
  { slug: "wifi", label: "Wi-Fi a bordo", icon: "wifi", tierWeight: 2, sortOrder: 4, description: "Internet 4G/5G compartilhada no carro." },
  { slug: "parada-cafe", label: "Parada pra café", icon: "coffee", tierWeight: 1, sortOrder: 5, description: "Parada programada pra café ou refeição." },
  { slug: "viagem-silenciosa", label: "Viagem silenciosa", icon: "moon", tierWeight: 0, sortOrder: 6, description: "Motorista prefere pouca conversa — bom pra descansar." },
  { slug: "bom-papo", label: "Bom papo", icon: "chat", tierWeight: 0, sortOrder: 7, description: "Motorista curte conversar na estrada." },
  { slug: "aceita-pet", label: "Aceita pet", icon: "paw", tierWeight: 0, sortOrder: 8, description: "Seu bichinho pode ir junto (combine antes no chat)." },
  { slug: "nao-fumante", label: "Não fumante", icon: "nosmoke", tierWeight: 0, sortOrder: 9, description: "Carro livre de fumaça." },
  { slug: "bagagem-extra", label: "Bagagem extra", icon: "luggage", tierWeight: 1, sortOrder: 10, description: "Porta-malas com espaço pra mala grande." },
  { slug: "usb", label: "Carregador USB", icon: "plug", tierWeight: 1, sortOrder: 11, description: "Tomada USB pra carregar o celular." },
  { slug: "assento-infantil", label: "Assento infantil", icon: "child", tierWeight: 1, sortOrder: 12, description: "Cadeirinha disponível mediante aviso." },
];

// ─── Pessoas ────────────────────────────────────────────────────────────────
const DRIVERS = [
  { key: "joao", name: "João Andrade", email: "motorista@trip.dev", bio: "Faço Recife–Caruaru toda semana a trabalho. Dirijo há 12 anos, zero multas. Café na Pousada do Ló é parada obrigatória.", city: "Recife" },
  { key: "carla", name: "Carla Menezes", email: "carla@trip.dev", bio: "Professora em Campina, família em João Pessoa. Viagem tranquila, playlist de MPB e ar sempre ligado.", city: "Campina Grande" },
  { key: "rafael", name: "Rafael Duarte", email: "rafael@trip.dev", bio: "Representante comercial. Rodo o litoral todo mês — Compass confortável, Wi-Fi e água gelada pra todo mundo.", city: "Recife" },
  { key: "ana", name: "Ana Beatriz Lima", email: "ana@trip.dev", bio: "Desço pra Maceió quase todo fim de semana. Gosto de sair cedinho pra pegar o nascer do sol na BR-101.", city: "Recife" },
  { key: "marcos", name: "Marcos Paulo", email: "marcos@trip.dev", bio: "Motorista aposentado do transporte escolar. Paciência de Jó, direção defensiva e muita história boa.", city: "Natal" },
  { key: "julia", name: "Júlia Sarmento", email: "julia@trip.dev", bio: "Estudante de medicina, volto pra Garanhuns nas folgas. Viagem silenciosa: ideal pra quem quer dormir.", city: "Recife" },
  { key: "pedro", name: "Pedro Cavalcanti", email: "pedro@trip.dev", bio: "Fortaleza–Natal com estilo: SUV nova, banco de couro, cafezinho na Canoa Quebrada quando dá tempo.", city: "Fortaleza" },
  { key: "livia", name: "Lívia Rocha", email: "livia@trip.dev", bio: "Fotógrafa de casamentos rodando o Brasil. Aceito pet de boa — a Nina (vira-lata caramelo) às vezes vai junto.", city: "Maceió" },
  { key: "bruno", name: "Bruno Almeida", email: "bruno@trip.dev", bio: "Consultor em São Paulo, viajo com frequência para Campinas e Rio. Civic confortável, Wi-Fi e parada para café.", city: "São Paulo" },
  { key: "camila", name: "Camila Rocha", email: "camila@trip.dev", bio: "Arquiteta carioca, divido a estrada entre Rio, São Paulo e Belo Horizonte. Carro novo e conversa leve.", city: "Rio de Janeiro" },
  { key: "diego", name: "Diego Martins", email: "diego@trip.dev", bio: "Trabalho com tecnologia em Curitiba e rodo bastante pelo Sul. Espaço para bagagem, água e internet a bordo.", city: "Curitiba" },
  { key: "sofia", name: "Sofia Costa", email: "sofia@trip.dev", bio: "Servidora em Brasília, faço o trecho até Goiânia com frequência. Viagem pontual, silenciosa e sem fumaça.", city: "Brasília" },
];

const PASSENGERS = [
  { key: "marina", name: "Marina Figueiredo", email: "passageiro@trip.dev", bio: "Viajo entre Recife e o interior quase toda semana. Prefiro viagens com ar e pouca conversa." },
  { key: "tiago", name: "Tiago Nunes", email: "tiago@trip.dev", bio: "Músico, sempre com um violão na mala." },
  { key: "bruna", name: "Bruna Carvalho", email: "bruna@trip.dev", bio: "Analista de RH em João Pessoa." },
  { key: "felipe", name: "Felipe Souza", email: "felipe@trip.dev", bio: "Estudante da UFRN." },
  { key: "renata", name: "Renata Alves", email: "renata@trip.dev", bio: "Enfermeira, plantões em Natal e família em Mossoró." },
];

// ─── Veículos ───────────────────────────────────────────────────────────────
const VEHICLES: Record<string, { brand: string; model: string; year: number; color: string; plate: string; category: VehicleCategory; seats: number }> = {
  joao: { brand: "Chevrolet", model: "Onix", year: 2021, color: "Prata", plate: "KJT2B47", category: "HATCH", seats: 4 },
  carla: { brand: "Fiat", model: "Argo", year: 2019, color: "Vermelho", plate: "QSD8C12", category: "HATCH", seats: 4 },
  rafael: { brand: "Jeep", model: "Compass", year: 2023, color: "Cinza grafite", plate: "RFP4E88", category: "SUV", seats: 4 },
  ana: { brand: "Volkswagen", model: "Virtus", year: 2022, color: "Branco", plate: "PGH7A03", category: "SEDAN", seats: 4 },
  marcos: { brand: "Chevrolet", model: "Spin", year: 2019, color: "Prata", plate: "NQZ3D55", category: "MINIVAN", seats: 6 },
  julia: { brand: "Fiat", model: "Mobi", year: 2018, color: "Azul", plate: "KHV9F21", category: "HATCH", seats: 3 },
  pedro: { brand: "Toyota", model: "Corolla Cross", year: 2024, color: "Preto", plate: "SBC1G09", category: "SUV", seats: 4 },
  livia: { brand: "Hyundai", model: "HB20S", year: 2020, color: "Branco", plate: "ORM6H74", category: "SEDAN", seats: 4 },
  bruno: { brand: "Honda", model: "Civic", year: 2022, color: "Preto", plate: "GHT4J82", category: "SEDAN", seats: 4 },
  camila: { brand: "Volkswagen", model: "Nivus", year: 2023, color: "Cinza", plate: "RJQ7C31", category: "SUV", seats: 4 },
  diego: { brand: "Jeep", model: "Renegade", year: 2023, color: "Branco", plate: "BDR5E96", category: "SUV", seats: 4 },
  sofia: { brand: "Toyota", model: "Yaris", year: 2021, color: "Prata", plate: "JKB8F24", category: "HATCH", seats: 4 },
};

// amenidades por motorista (slugs)
const DRIVER_AMENITIES: Record<string, string[]> = {
  joao: ["ar-condicionado", "usb", "nao-fumante", "bom-papo", "parada-cafe"],
  carla: ["ar-condicionado", "musica", "nao-fumante"],
  rafael: ["ar-condicionado", "agua-cortesia", "wifi", "usb", "bagagem-extra", "nao-fumante", "parada-cafe"],
  ana: ["ar-condicionado", "musica", "usb", "nao-fumante", "agua-cortesia"],
  marcos: ["bagagem-extra", "bom-papo", "parada-cafe", "nao-fumante", "assento-infantil"],
  julia: ["viagem-silenciosa", "nao-fumante", "usb"],
  pedro: ["ar-condicionado", "agua-cortesia", "wifi", "usb", "musica", "bagagem-extra", "nao-fumante", "parada-cafe"],
  livia: ["ar-condicionado", "aceita-pet", "musica", "usb", "nao-fumante"],
  bruno: ["ar-condicionado", "wifi", "usb", "agua-cortesia", "nao-fumante", "parada-cafe"],
  camila: ["ar-condicionado", "musica", "bom-papo", "usb", "agua-cortesia", "nao-fumante"],
  diego: ["ar-condicionado", "agua-cortesia", "wifi", "usb", "bagagem-extra", "nao-fumante", "parada-cafe"],
  sofia: ["viagem-silenciosa", "ar-condicionado", "nao-fumante", "usb"],
};

// rotas: [driverKey, origem, destino, hora saída, preço/assento em R$, recado]
const ROUTES: Array<[string, string, string, number, number, string]> = [
  ["joao", "Recife", "Caruaru", 6, 45, "Saio da Zona Sul, pego a BR-232 sem pressa. Parada rápida no posto Bela Vista."],
  ["joao", "Caruaru", "Recife", 17, 45, "Volta no fim da tarde, chegando em Recife antes das 20h."],
  ["carla", "Campina Grande", "João Pessoa", 7, 40, "Playlist de MPB e ar ligado. Embarque no Açude Velho."],
  ["carla", "João Pessoa", "Campina Grande", 18, 40, "Volto depois do expediente, saída pontual."],
  ["rafael", "Recife", "João Pessoa", 8, 65, "Compass com Wi-Fi e água gelada. Embarque no Shopping Recife ou Derby."],
  ["rafael", "Recife", "Natal", 6, 120, "Viagem direta pela BR-101, uma parada pra café em Mamanguape."],
  ["ana", "Recife", "Maceió", 5, 75, "Saída cedinho pra pegar o nascer do sol na 101. Chegada antes do almoço."],
  ["ana", "Maceió", "Recife", 16, 75, "Volta no fim da tarde. Deixo no Derby ou Boa Viagem."],
  ["marcos", "Natal", "Mossoró", 9, 55, "Spin com porta-malas grande — mala de viagem não é problema. Levo cadeirinha se avisar."],
  ["julia", "Recife", "Garanhuns", 13, 50, "Viagem silenciosa, ideal pra descansar. Saída da UFPE."],
  ["pedro", "Fortaleza", "Natal", 7, 130, "Corolla Cross 2024, banco de couro. Parada pra almoço em Canoa Quebrada se a turma topar."],
  ["pedro", "Natal", "Fortaleza", 7, 130, "Volta com o mesmo conforto. Wi-Fi a bordo pra quem precisa trabalhar."],
  ["livia", "Maceió", "Aracaju", 8, 60, "Aceito pet (a Nina aprova). Embarque na Pajuçara."],
  ["livia", "Maceió", "Recife", 9, 70, "Fotógrafa a caminho de mais um casamento — mala grande cabe sim."],
  ["marcos", "Natal", "Pipa", 8, 35, "Rota de praia! Deixo na entrada de Pipa ou no centrinho."],
  ["rafael", "João Pessoa", "Recife", 19, 65, "Volta no início da noite, chegada no Derby."],
  ["bruno", "São Paulo", "Campinas", 7, 50, "Saída da Barra Funda, com parada rápida para café antes de Campinas."],
  ["bruno", "Campinas", "São Paulo", 18, 50, "Retorno depois do expediente, desembarque na Barra Funda."],
  ["bruno", "São Paulo", "Rio de Janeiro", 6, 140, "Viagem pela Dutra, Wi-Fi a bordo e uma parada programada para café."],
  ["camila", "Rio de Janeiro", "Belo Horizonte", 6, 130, "Saída cedo da Rodoviária Novo Rio, com uma parada no caminho."],
  ["camila", "Rio de Janeiro", "São Paulo", 7, 140, "Nivus confortável, água a bordo e chegada na Barra Funda."],
  ["diego", "Curitiba", "Florianópolis", 7, 110, "Saída do Jardim Botânico, espaço para mala e parada rápida em Joinville."],
  ["diego", "Florianópolis", "Curitiba", 17, 110, "Retorno pela BR-101 com água, Wi-Fi e espaço no porta-malas."],
  ["diego", "Curitiba", "Porto Alegre", 6, 150, "Viagem longa com duas paradas programadas para café e descanso."],
  ["sofia", "Brasília", "Goiânia", 7, 80, "Saída da Rodoviária do Plano Piloto, viagem silenciosa e pontual."],
  ["sofia", "Goiânia", "Brasília", 18, 80, "Retorno no fim do dia, sem fumaça e com carregador USB."],
];

async function main() {
  validateNationalSeed();
  console.log("→ limpando banco...");
  await prisma.$transaction([
    prisma.message.deleteMany(),
    prisma.conversation.deleteMany(),
    prisma.report.deleteMany(),
    prisma.favorite.deleteMany(),
    prisma.review.deleteMany(),
    prisma.payout.deleteMany(),
    prisma.payment.deleteMany(),
    prisma.booking.deleteMany(),
    prisma.tripAmenity.deleteMany(),
    prisma.trip.deleteMany(),
    prisma.vehicle.deleteMany(),
    prisma.identityVerification.deleteMany(),
    prisma.driverProfile.deleteMany(),
    prisma.account.deleteMany(),
    prisma.user.deleteMany(),
    prisma.amenity.deleteMany(),
    prisma.city.deleteMany(),
  ]);

  console.log("→ cidades e catálogo de opcionais...");
  await prisma.city.createMany({ data: CITIES });
  await prisma.amenity.createMany({ data: AMENITIES });
  const amenities = await prisma.amenity.findMany();
  const amenityBySlug = new Map(amenities.map((a) => [a.slug, a]));
  const cityByName = new Map(CITIES.map((c) => [c.name, c]));

  console.log("→ usuários...");
  const driverUsers: Record<string, { id: string; name: string; email: string }> = {};
  for (const d of DRIVERS) {
    const user = await prisma.user.create({
      data: {
        name: d.name,
        email: d.email,
        passwordHash: PASSWORD_HASH,
        bio: d.bio,
        emailVerified: new Date(),
        phone: "+55 81 9" + String(Math.abs(hashCode(d.key)) % 90000000 + 10000000),
        phoneVerified: new Date(),
        identityStatus: "VERIFIED",
        driverProfile: {
          create: {
            cnhNumber: String(Math.abs(hashCode(d.key + "cnh")) % 90000000000 + 10000000000),
            cnhCategory: "B",
            cnhExpiresAt: new Date("2030-06-30"),
            status: "VERIFIED",
            tripMessage: d.bio,
          },
        },
        verifications: {
          create: {
            provider: "mock",
            providerRef: `seed_${d.key}`,
            status: "VERIFIED",
            reviewedAt: new Date(),
            notes: "Verificação de identidade aprovada (seed).",
          },
        },
      },
    });
    driverUsers[d.key] = user;
  }

  const passengerUsers: Record<string, { id: string; name: string; email: string }> = {};
  for (const p of PASSENGERS) {
    const user = await prisma.user.create({
      data: {
        name: p.name,
        email: p.email,
        passwordHash: PASSWORD_HASH,
        bio: p.bio,
        emailVerified: new Date(),
        identityStatus: p.key === "marina" ? "VERIFIED" : "UNVERIFIED",
      },
    });
    passengerUsers[p.key] = user;
  }

  console.log("→ veículos...");
  const vehicles: Record<string, { id: string }> = {};
  for (const [key, v] of Object.entries(VEHICLES)) {
    vehicles[key] = await prisma.vehicle.create({
      data: { ...v, ownerId: driverUsers[key].id },
    });
  }

  console.log("→ viagens (próximos 14 dias + histórico)...");
  const now = new Date();
  const tripsCreated: Array<{ id: string; driverKey: string; departAt: Date; priceCents: number; seatsTotal: number }> = [];

  // Publica cada rota em 3 datas dos próximos 12 dias
  for (const [i, [driverKey, originName, destName, hour, priceBRL, notes]] of ROUTES.entries()) {
    const origin = cityByName.get(originName)!;
    const dest = cityByName.get(destName)!;
    const straight = haversineKm(origin.lat, origin.lng, dest.lat, dest.lng);
    const distanceKm = estimateRoadDistanceKm(straight);
    const durationMin = estimateDurationMin(distanceKm);
    const vehicle = VEHICLES[driverKey];
    const slugs = DRIVER_AMENITIES[driverKey];
    const tier = deriveTier({
      amenityWeights: slugs.map((s) => amenityBySlug.get(s)!.tierWeight),
      vehicleYear: vehicle.year,
      vehicleCategory: vehicle.category,
    });

    for (const dayOffset of [1 + (i % 4), 5 + (i % 4), 9 + (i % 3)]) {
      const departAt = new Date(now);
      departAt.setDate(departAt.getDate() + dayOffset);
      departAt.setHours(hour, [0, 15, 30][i % 3], 0, 0);
      const arriveEstAt = new Date(departAt.getTime() + durationMin * 60_000);
      const seatsTotal = Math.min(vehicle.seats, 4);
      const trip = await prisma.trip.create({
        data: {
          driverId: driverUsers[driverKey].id,
          vehicleId: vehicles[driverKey].id,
          originCity: origin.name,
          originState: origin.state,
          originLat: origin.lat,
          originLng: origin.lng,
          destCity: dest.name,
          destState: dest.state,
          destLat: dest.lat,
          destLng: dest.lng,
          departAt,
          arriveEstAt,
          distanceKm,
          durationMin,
          meetingPoint: pickMeetingPoint(origin.name),
          dropoffPoint: pickMeetingPoint(dest.name),
          notes,
          seatsTotal,
          seatsAvailable: seatsTotal,
          pricePerSeatCents: priceBRL * 100,
          tier,
          amenities: { create: slugs.map((s) => ({ amenityId: amenityBySlug.get(s)!.id })) },
        },
      });
      tripsCreated.push({ id: trip.id, driverKey, departAt, priceCents: priceBRL * 100, seatsTotal });
    }
  }

  console.log("→ histórico: viagens concluídas, reservas e avaliações...");
  const REVIEWS: Array<[string, string, number, string]> = [
    ["marina", "joao", 5, "Viagem impecável. João é pontual, o carro estava limpo e o ar geladinho. Recomendo demais!"],
    ["tiago", "joao", 5, "Papo bom da saída à chegada. Parada pro café no meio do caminho foi um bônus."],
    ["bruna", "joao", 4, "Tudo certo, só saímos 10 minutinhos atrasados. De resto, perfeito."],
    ["marina", "rafael", 5, "O Compass é outro nível — Wi-Fi funcionando de verdade e água gelada. Valeu cada centavo."],
    ["felipe", "rafael", 5, "Melhor experiência de carona que já tive. Motorista super profissional."],
    ["renata", "marcos", 5, "Seu Marcos é um querido. Dirige com muito cuidado e ainda ajudou com as malas."],
    ["bruna", "carla", 5, "Playlist ótima e conversa boa. Chegamos até antes do previsto."],
    ["tiago", "ana", 4, "Saída pontual às 5h. Vi o nascer do sol na BR-101 — experiência linda."],
    ["felipe", "pedro", 5, "Carro novíssimo, banco de couro, parada em Canoa Quebrada. Parecia turismo de luxo."],
    ["marina", "julia", 5, "Viagem silenciosa de verdade — dormi de Recife a Garanhuns. Acordei na rodoviária."],
    ["renata", "livia", 5, "A Nina (cachorrinha) é a melhor copilota do Brasil. Aceitou minha gata a bordo sem drama."],
    ["tiago", "livia", 4, "Mala grande do violão coube tranquilo. Boa motorista."],
    ["marina", "bruno", 5, "Civic muito confortável, Wi-Fi estável e parada para café no tempo certo."],
    ["bruna", "camila", 5, "Camila foi pontual e muito cuidadosa. O Nivus estava impecável."],
    ["felipe", "diego", 5, "Viagem tranquila pelo Sul, com bastante espaço para bagagem e água gelada."],
    ["renata", "sofia", 5, "Sofia dirige com calma e respeitou o combinado de uma viagem silenciosa."],
  ];

  validateDriverReferences(REVIEWS);

  let dayBack = 3;
  for (const [passKey, driverKey, rating, comment] of REVIEWS) {
    const routeIdx = ROUTES.findIndex(([dk]) => dk === driverKey);
    const [, originName, destName, hour, priceBRL] = ROUTES[routeIdx];
    const origin = cityByName.get(originName)!;
    const dest = cityByName.get(destName)!;
    const straight = haversineKm(origin.lat, origin.lng, dest.lat, dest.lng);
    const distanceKm = estimateRoadDistanceKm(straight);
    const durationMin = estimateDurationMin(distanceKm);
    const departAt = new Date(now);
    departAt.setDate(departAt.getDate() - dayBack);
    departAt.setHours(hour, 0, 0, 0);
    dayBack += 5;
    const vehicle = VEHICLES[driverKey];
    const slugs = DRIVER_AMENITIES[driverKey];
    const seatsTotal = Math.min(vehicle.seats, 4);

    const trip = await prisma.trip.create({
      data: {
        driverId: driverUsers[driverKey].id,
        vehicleId: vehicles[driverKey].id,
        status: "COMPLETED",
        originCity: origin.name,
        originState: origin.state,
        originLat: origin.lat,
        originLng: origin.lng,
        destCity: dest.name,
        destState: dest.state,
        destLat: dest.lat,
        destLng: dest.lng,
        departAt,
        arriveEstAt: new Date(departAt.getTime() + durationMin * 60_000),
        distanceKm,
        durationMin,
        meetingPoint: pickMeetingPoint(origin.name),
        notes: null,
        seatsTotal,
        seatsAvailable: seatsTotal - 1,
        pricePerSeatCents: priceBRL * 100,
        tier: deriveTier({
          amenityWeights: slugs.map((s) => amenityBySlug.get(s)!.tierWeight),
          vehicleYear: vehicle.year,
          vehicleCategory: vehicle.category,
        }),
        amenities: { create: slugs.map((s) => ({ amenityId: amenityBySlug.get(s)!.id })) },
      },
    });

    const price = computeBookingPrice(priceBRL * 100, 1);
    const booking = await prisma.booking.create({
      data: {
        code: generateBookingCode(),
        tripId: trip.id,
        passengerId: passengerUsers[passKey].id,
        seats: 1,
        status: "COMPLETED",
        pricePerSeatCents: price.pricePerSeatCents,
        subtotalCents: price.subtotalCents,
        serviceFeeCents: price.serviceFeeCents,
        totalCents: price.totalCents,
        shareToken: generateShareToken(),
        payment: {
          create: {
            provider: "mock",
            providerRef: `seed_pay_${trip.id.slice(-6)}`,
            method: dayBack % 2 === 0 ? "PIX" : "CARD",
            status: "PAID",
            amountCents: price.totalCents,
            serviceFeeCents: price.serviceFeeCents,
            driverAmountCents: price.driverAmountCents,
            paidAt: new Date(departAt.getTime() - 86_400_000),
            cardLast4: dayBack % 2 === 0 ? null : "4242",
          },
        },
        payout: {
          create: {
            driverId: driverUsers[driverKey].id,
            amountCents: price.driverAmountCents,
            status: "PAID",
            releasedAt: new Date(departAt.getTime() + durationMin * 60_000 + 3_600_000),
            paidAt: new Date(departAt.getTime() + 2 * 86_400_000),
          },
        },
      },
    });

    // avaliação passageiro → motorista
    await prisma.review.create({
      data: {
        tripId: trip.id,
        bookingId: booking.id,
        authorId: passengerUsers[passKey].id,
        targetId: driverUsers[driverKey].id,
        direction: "PASSENGER_TO_DRIVER",
        rating,
        comment,
        createdAt: new Date(departAt.getTime() + durationMin * 60_000 + 7_200_000),
      },
    });
    // e a recíproca motorista → passageiro
    await prisma.review.create({
      data: {
        tripId: trip.id,
        bookingId: booking.id,
        authorId: driverUsers[driverKey].id,
        targetId: passengerUsers[passKey].id,
        direction: "DRIVER_TO_PASSENGER",
        rating: 5,
        comment: "Passageiro(a) pontual e educado(a). Viagem tranquila!",
        createdAt: new Date(departAt.getTime() + durationMin * 60_000 + 10_800_000),
      },
    });
  }

  console.log("→ agregados de reputação...");
  for (const user of [...Object.values(driverUsers), ...Object.values(passengerUsers)]) {
    const asDriver = await prisma.review.aggregate({
      where: { targetId: user.id, direction: "PASSENGER_TO_DRIVER" },
      _avg: { rating: true },
      _count: true,
    });
    const asPassenger = await prisma.review.aggregate({
      where: { targetId: user.id, direction: "DRIVER_TO_PASSENGER" },
      _avg: { rating: true },
      _count: true,
    });
    await prisma.user.update({
      where: { id: user.id },
      data: {
        driverRatingAvg: asDriver._avg.rating ?? 0,
        driverRatingCount: asDriver._count,
        passengerRatingAvg: asPassenger._avg.rating ?? 0,
        passengerRatingCnt: asPassenger._count,
      },
    });
  }

  console.log("→ uma reserva futura confirmada para a conta demo...");
  const futureTrip = tripsCreated.find((t) => t.driverKey === "joao")!;
  const demoPrice = computeBookingPrice(futureTrip.priceCents, 1);
  await prisma.$transaction([
    prisma.booking.create({
      data: {
        code: generateBookingCode(),
        tripId: futureTrip.id,
        passengerId: passengerUsers["marina"].id,
        seats: 1,
        status: "CONFIRMED",
        pricePerSeatCents: demoPrice.pricePerSeatCents,
        subtotalCents: demoPrice.subtotalCents,
        serviceFeeCents: demoPrice.serviceFeeCents,
        totalCents: demoPrice.totalCents,
        shareToken: generateShareToken(),
        payment: {
          create: {
            provider: "mock",
            providerRef: "seed_pay_demo",
            method: "PIX",
            status: "PAID",
            amountCents: demoPrice.totalCents,
            serviceFeeCents: demoPrice.serviceFeeCents,
            driverAmountCents: demoPrice.driverAmountCents,
            paidAt: new Date(),
          },
        },
        payout: {
          create: {
            driverId: driverUsers["joao"].id,
            amountCents: demoPrice.driverAmountCents,
            status: "HELD",
          },
        },
      },
    }),
    prisma.trip.update({
      where: { id: futureTrip.id },
      data: { seatsAvailable: { decrement: 1 } },
    }),
  ]);

  console.log("→ conta única: João reserva como passageiro em viagem de Rafael...");
  const joaoPassengerTrip = tripsCreated.find((trip) => trip.driverKey === "rafael")!;
  const joaoPassengerPrice = computeBookingPrice(joaoPassengerTrip.priceCents, 1);
  await prisma.$transaction([
    prisma.booking.create({
      data: {
        code: generateBookingCode(),
        tripId: joaoPassengerTrip.id,
        passengerId: driverUsers["joao"].id,
        seats: 1,
        status: "CONFIRMED",
        pricePerSeatCents: joaoPassengerPrice.pricePerSeatCents,
        subtotalCents: joaoPassengerPrice.subtotalCents,
        serviceFeeCents: joaoPassengerPrice.serviceFeeCents,
        totalCents: joaoPassengerPrice.totalCents,
        shareToken: generateShareToken(),
        payment: {
          create: {
            provider: "mock",
            providerRef: "seed_pay_joao_passenger",
            method: "PIX",
            status: "PAID",
            amountCents: joaoPassengerPrice.totalCents,
            serviceFeeCents: joaoPassengerPrice.serviceFeeCents,
            driverAmountCents: joaoPassengerPrice.driverAmountCents,
            paidAt: new Date(),
          },
        },
        payout: {
          create: {
            driverId: driverUsers["rafael"].id,
            amountCents: joaoPassengerPrice.driverAmountCents,
            status: "HELD",
          },
        },
      },
    }),
    prisma.trip.update({
      where: { id: joaoPassengerTrip.id },
      data: { seatsAvailable: { decrement: 1 } },
    }),
  ]);

  // conversa demo entre Marina e João sobre a reserva futura
  const convo = await prisma.conversation.create({
    data: {
      tripId: futureTrip.id,
      passengerId: passengerUsers["marina"].id,
      driverId: driverUsers["joao"].id,
    },
  });
  const msgs: Array<[string, string]> = [
    ["marina", "Oi João! Reservei um lugar. Posso embarcar no Derby em vez da Zona Sul?"],
    ["joao", "Oi Marina! Pode sim, passo pelo Derby umas 6h15. Te espero em frente ao quiosque do parque."],
    ["marina", "Perfeito, combinado! Levo só uma mochila."],
    ["joao", "Ótimo. Qualquer coisa me chama por aqui. Boa viagem pra gente! 🚗"],
  ];
  for (const [who, body] of msgs) {
    await prisma.message.create({
      data: {
        conversationId: convo.id,
        senderId: who === "marina" ? passengerUsers["marina"].id : driverUsers["joao"].id,
        body,
        readAt: new Date(),
      },
    });
  }

  // favoritos demo
  const favTargets = tripsCreated.filter((t) => ["rafael", "pedro"].includes(t.driverKey)).slice(0, 3);
  for (const t of favTargets) {
    await prisma.favorite.create({ data: { userId: passengerUsers["marina"].id, tripId: t.id } });
  }

  const counts = {
    cidades: await prisma.city.count(),
    usuarios: await prisma.user.count(),
    viagens: await prisma.trip.count(),
    reservas: await prisma.booking.count(),
    avaliacoes: await prisma.review.count(),
  };
  console.log("✓ seed concluído:", counts);
}

function pickMeetingPoint(city: string): string {
  const points: Record<string, string> = {
    Recife: "Parque do Derby (em frente ao quiosque)",
    Caruaru: "Rodoviária de Caruaru — plataforma externa",
    "João Pessoa": "Busto de Tamandaré, Tambaú",
    "Campina Grande": "Açude Velho (Monumento aos Pioneiros)",
    Natal: "Midway Mall — entrada principal",
    Fortaleza: "Shopping RioMar — piso L1",
    Maceió: "Pajuçara, em frente ao Mercado do Artesanato",
    Aracaju: "Orla de Atalaia — Oceanário",
    Garanhuns: "Praça Mestre Dominguinhos",
    Mossoró: "Partage Shopping — entrada Leste",
    Pipa: "Entrada de Pipa (posto Ale)",
    "Porto de Galinhas": "Rótula do centro de Porto",
    Petrolina: "Orla de Petrolina — Catedral",
    Olinda: "Praça do Carmo",
    "São Paulo": "Terminal Rodoviário Barra Funda — entrada principal",
    Campinas: "Terminal Rodoviário de Campinas — embarque principal",
    Santos: "Terminal Rodoviário de Santos — entrada principal",
    "Rio de Janeiro": "Rodoviária Novo Rio — setor de embarque",
    "Belo Horizonte": "Praça da Estação — entrada do Museu de Artes e Ofícios",
    Curitiba: "Jardim Botânico — portão principal",
    Florianópolis: "Terminal Rodoviário Rita Maria — entrada principal",
    "Porto Alegre": "Estação Rodoviária de Porto Alegre — entrada principal",
    Brasília: "Rodoviária do Plano Piloto — plataforma superior",
    Goiânia: "Terminal Rodoviário de Goiânia — entrada principal",
  };
  return points[city] ?? `Centro de ${city}`;
}

function validateDriverReferences(reviews: Array<[string, string, number, string]>): void {
  const declaredDrivers = new Set(DRIVERS.map((driver) => driver.key));
  const referencedDrivers = new Set([
    ...ROUTES.map(([driverKey]) => driverKey),
    ...reviews.map(([, driverKey]) => driverKey),
  ]);
  const missing = [...referencedDrivers].filter(
    (driverKey) =>
      !declaredDrivers.has(driverKey) ||
      !VEHICLES[driverKey] ||
      !DRIVER_AMENITIES[driverKey]
  );
  if (missing.length > 0) {
    throw new Error(`Driver keys inconsistentes no seed: ${missing.join(", ")}`);
  }
}

function validateNationalSeed(): void {
  if (CITIES.length !== 49) {
    throw new Error(`O seed nacional deve conter exatamente 49 cidades; recebeu ${CITIES.length}.`);
  }
  const cityNames = new Set(CITIES.map((city) => city.name));
  const citySlugs = new Set(CITIES.map((city) => city.slug));
  if (cityNames.size !== CITIES.length || citySlugs.size !== CITIES.length) {
    throw new Error("O seed nacional contém cidades ou slugs duplicados.");
  }
  const amenitySlugs = new Set(AMENITIES.map((amenity) => amenity.slug));
  for (const driver of DRIVERS) {
    if (!VEHICLES[driver.key] || !DRIVER_AMENITIES[driver.key]) {
      throw new Error(`Motorista sem veículo ou amenidades: ${driver.key}`);
    }
    const invalidAmenity = DRIVER_AMENITIES[driver.key].find((slug) => !amenitySlugs.has(slug));
    if (invalidAmenity) throw new Error(`Amenidade inválida para ${driver.key}: ${invalidAmenity}`);
  }
  for (const [driverKey, origin, dest] of ROUTES) {
    if (!DRIVERS.some((driver) => driver.key === driverKey) || !VEHICLES[driverKey] || !DRIVER_AMENITIES[driverKey]) {
      throw new Error(`Rota usa driverKey inconsistente: ${driverKey}`);
    }
    if (!cityNames.has(origin) || !cityNames.has(dest)) {
      throw new Error(`Rota usa cidade ausente do catálogo: ${origin} → ${dest}`);
    }
  }
}

function hashCode(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return h;
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
