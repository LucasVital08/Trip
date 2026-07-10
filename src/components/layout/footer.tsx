import Link from "next/link";
import { BRAND } from "@/config/brand";
import { BrandMark } from "@/components/ui/brand";
import { RoadDivider } from "@/components/ui/road-divider";

export function Footer() {
  return (
    <footer className="mt-auto bg-ink text-sand-card">
      <RoadDivider />
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
        <div>
          <BrandMark dark />
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-sand-card/60">
            {BRAND.tagline} Plataforma de tecnologia que conecta motoristas e
            passageiros — a viagem é combinada entre vocês.
          </p>
        </div>
        <FooterCol
          title="Viajar"
          links={[
            ["/buscar", "Buscar viagem"],
            ["/como-funciona", "Como funciona"],
            ["/seguranca", "Segurança"],
          ]}
        />
        <FooterCol
          title="Dirigir"
          links={[
            ["/motorista/comecar", "Oferecer carona"],
            ["/motorista", "Painel do motorista"],
            ["/como-funciona#motorista", "Quanto posso receber?"],
          ]}
        />
        <FooterCol
          title="Institucional"
          links={[
            ["/termos", "Termos de uso"],
            ["/privacidade", "Privacidade"],
            [`mailto:${BRAND.supportEmail}`, "Fale com a gente"],
          ]}
        />
      </div>
      <div className="border-t border-sand-card/10 py-5 text-center text-xs text-sand-card/40">
        © {new Date().getFullYear()} {BRAND.legalName} · {BRAND.name} conecta pessoas;
        o transporte é acordado entre motorista e passageiro.
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <nav aria-label={title}>
      <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-amber">{title}</h3>
      <ul className="space-y-2">
        {links.map(([href, label]) => (
          <li key={href}>
            <Link href={href} className="text-sm text-sand-card/70 hover:text-sand-card">
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
