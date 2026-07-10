import type { Metadata } from "next";
import { BRAND } from "@/config/brand";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Icon } from "@/components/ui/icon";
import { RoadDivider } from "@/components/ui/road-divider";

export const metadata: Metadata = { title: "Segurança" };

const FEATURES = [
  {
    icon: "shield",
    title: "Verificação de identidade",
    desc: "Todo motorista passa por verificação de documento + selfie com prova de vida antes de publicar qualquer viagem. Passageiros também podem se verificar — o selo aparece no perfil e aumenta a confiança (e as reservas).",
  },
  {
    icon: "star",
    title: "Avaliação mútua e pública",
    desc: "Depois de cada viagem, motorista e passageiro se avaliam. As notas e comentários são públicos: a reputação é construída viagem a viagem e não pode ser apagada.",
  },
  {
    icon: "share",
    title: "Acompanhamento em tempo real",
    desc: "Cada reserva gera um link de acompanhamento para você enviar a alguém de confiança: rota, horários, carro, placa e motorista — sem precisar de conta.",
  },
  {
    icon: "alert",
    title: "Emergência a um toque",
    desc: "Durante a viagem, o botão de emergência disca para os serviços públicos (190/193) e exibe placa e trajeto para você informar rapidamente. Seu contato de segurança fica sempre à mão.",
  },
  {
    icon: "message",
    title: "Chat interno, telefone protegido",
    desc: "Todos os combinados acontecem no chat do app. Seu número não é exposto antes da reserva — e nunca sem sua ação.",
  },
  {
    icon: "wallet",
    title: "Pagamento protegido",
    desc: "O pagamento fica retido pela plataforma e só é repassado ao motorista após a viagem. Nada de dinheiro vivo, nada de Pix por fora — é isso que garante reembolso e suporte.",
  },
  {
    icon: "x",
    title: "Denúncia e moderação",
    desc: "Qualquer comportamento fora da linha pode ser denunciado no app. Perfis denunciados são analisados e podem ser bloqueados — inclusive preventivamente.",
  },
];

export default function SafetyPage() {
  return (
    <div className="flex min-h-dvh flex-col">
      <Header dark />
      <section className="bg-ink pb-14 pt-10 text-sand-card">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <p className="inline-flex items-center gap-2 rounded-full border border-trust/40 bg-trust/15 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-[#7fc9a8]">
            <Icon name="shield" size={14} />
            Segurança
          </p>
          <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl" style={{ fontFamily: "var(--font-display)" }}>
            Confiança não é acaso.
            <br />É projeto.
          </h1>
          <p className="mt-4 max-w-xl leading-relaxed text-sand-card/70">
            Viajar com alguém que você ainda não conhece exige mais do que boa
            vontade. No {BRAND.name}, cada camada do produto foi desenhada para
            que você saiba com quem está viajando — antes, durante e depois.
          </p>
        </div>
        <RoadDivider className="mt-12" />
      </section>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-12 sm:px-6">
        <div className="space-y-4">
          {FEATURES.map((f) => (
            <div key={f.title} className="flex gap-4 rounded-3xl border border-line bg-sand-card p-6 shadow-card">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-trust/10 text-trust">
                <Icon name={f.icon} size={22} />
              </span>
              <div>
                <h2 className="font-bold">{f.title}</h2>
                <p className="mt-1 text-sm leading-relaxed text-ink/65">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <p className="mt-10 rounded-2xl bg-sand-card px-5 py-4 text-sm leading-relaxed text-ink/60 shadow-card">
          <strong>Transparência:</strong> o {BRAND.name} é uma plataforma de
          intermediação — conectamos pessoas, e o transporte é combinado entre
          motorista e passageiro. As ferramentas acima existem para dar à
          comunidade o máximo de informação e proteção em cada etapa.
        </p>
      </main>
      <Footer />
    </div>
  );
}
