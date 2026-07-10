import Link from "next/link";
import { getCurrentUser } from "@/lib/session";
import { logoutAction } from "@/actions/auth";
import { BrandLink } from "@/components/ui/brand";
import { Avatar } from "@/components/ui/avatar";
import { Icon } from "@/components/ui/icon";

/**
 * Header global. `dark` para páginas com hero em asfalto-noite (landing),
 * claro nas demais.
 */
export async function Header({ dark = false }: { dark?: boolean }) {
  const user = await getCurrentUser();
  const base = dark
    ? "bg-ink text-sand-card"
    : "bg-sand-card/90 text-ink border-b border-line backdrop-blur";
  const linkCls = dark
    ? "text-sand-card/80 hover:text-sand-card"
    : "text-ink/70 hover:text-ink";

  return (
    <header className={`${base} sticky top-0 z-40`}>
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <BrandLink dark={dark} />
        <nav aria-label="Principal" className="flex items-center gap-1 sm:gap-2">
          <Link href="/buscar" className={`rounded-lg px-3 py-2 text-sm font-medium ${linkCls}`}>
            Buscar viagem
          </Link>
          <Link
            href={user?.driverProfile ? "/motorista" : "/motorista/comecar"}
            className={`hidden rounded-lg px-3 py-2 text-sm font-medium sm:block ${linkCls}`}
          >
            {user?.driverProfile ? "Painel do motorista" : "Oferecer carona"}
          </Link>

          {user ? (
            <details className="group relative">
              <summary
                className="flex cursor-pointer list-none items-center gap-2 rounded-full p-1 pr-2 hover:bg-ink/5 [&::-webkit-details-marker]:hidden"
                aria-label="Menu da conta"
              >
                <Avatar name={user.name} src={user.avatarUrl} size={34} />
                <Icon name="chevron-down" size={14} className={dark ? "text-sand-card/70" : "text-ink/50"} />
              </summary>
              <div className="absolute right-0 top-12 z-50 w-60 rounded-xl border border-line bg-sand-card p-2 text-ink shadow-card-hover">
                <p className="truncate px-3 pb-2 pt-1 text-sm font-semibold">{user.name}</p>
                <div className="road-stripe-subtle mb-2" />
                <MenuLink href="/minhas-viagens" icon="calendar" label="Minhas viagens" />
                <MenuLink href="/mensagens" icon="message" label="Mensagens" />
                <MenuLink href="/favoritos" icon="heart" label="Favoritos" />
                <MenuLink href="/perfil" icon="users" label="Perfil e segurança" />
                {user.driverProfile && (
                  <MenuLink href="/motorista" icon="car" label="Painel do motorista" />
                )}
                <form action={logoutAction}>
                  <button
                    type="submit"
                    className="mt-1 w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-ink/70 hover:bg-sand"
                  >
                    Sair
                  </button>
                </form>
              </div>
            </details>
          ) : (
            <>
              <Link href="/entrar" className={`rounded-lg px-3 py-2 text-sm font-medium ${linkCls}`}>
                Entrar
              </Link>
              <Link
                href="/cadastrar"
                className="rounded-full bg-amber px-4 py-2 text-sm font-bold text-ink transition hover:bg-amber-deep"
              >
                Criar conta
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

function MenuLink({ href, icon, label }: { href: string; icon: string; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-ink/80 hover:bg-sand"
    >
      <Icon name={icon} size={16} className="text-amber-deep" />
      {label}
    </Link>
  );
}
