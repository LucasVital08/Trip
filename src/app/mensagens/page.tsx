import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { formatDateShort } from "@/lib/dates";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Avatar } from "@/components/ui/avatar";
import { Icon } from "@/components/ui/icon";

export const metadata: Metadata = { title: "Mensagens" };
export const dynamic = "force-dynamic";

export default async function MessagesPage() {
  const user = await requireUser("/mensagens");

  const convos = await prisma.conversation.findMany({
    where: { OR: [{ passengerId: user.id }, { driverId: user.id }] },
    include: {
      trip: { select: { originCity: true, destCity: true, departAt: true } },
      passenger: { select: { id: true, name: true, avatarUrl: true } },
      driver: { select: { id: true, name: true, avatarUrl: true } },
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
      _count: { select: { messages: { where: { readAt: null, senderId: { not: user.id } } } } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="flex min-h-dvh flex-col">
      <Header />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6">
        <h1 className="text-3xl font-bold tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
          Mensagens
        </h1>
        <p className="mt-1 text-ink/60">
          Conversas por viagem — seu telefone só é compartilhado se você quiser.
        </p>

        {convos.length === 0 ? (
          <div className="mt-8 rounded-3xl border border-dashed border-line bg-sand-card p-10 text-center">
            <Icon name="message" size={36} className="mx-auto text-ink/25" />
            <p className="mt-3 font-semibold text-ink/70">Nenhuma conversa ainda.</p>
            <p className="mt-1 text-sm text-ink/55">
              Abra o chat com um motorista na página de qualquer viagem.
            </p>
          </div>
        ) : (
          <ul className="mt-8 space-y-2">
            {convos.map((c) => {
              const other = c.passengerId === user.id ? c.driver : c.passenger;
              const last = c.messages[0];
              const unread = c._count.messages;
              return (
                <li key={c.id}>
                  <Link
                    href={`/mensagens/${c.id}`}
                    className="flex items-center gap-4 rounded-2xl border border-line bg-sand-card p-4 shadow-card transition hover:shadow-card-hover"
                  >
                    <Avatar name={other.name} src={other.avatarUrl} size={46} />
                    <div className="min-w-0 flex-1">
                      <p className="flex items-baseline justify-between gap-2">
                        <span className="font-bold">{other.name}</span>
                        {last && <span className="shrink-0 text-xs text-ink/45">{formatDateShort(last.createdAt)}</span>}
                      </p>
                      <p className="text-xs font-semibold text-amber-deep">
                        {c.trip.originCity} → {c.trip.destCity} · {formatDateShort(c.trip.departAt)}
                      </p>
                      {last && (
                        <p className={`mt-0.5 truncate text-sm ${unread > 0 ? "font-bold text-ink" : "text-ink/55"}`}>
                          {last.body}
                        </p>
                      )}
                    </div>
                    {unread > 0 && (
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-deep text-xs font-bold text-sand-card">
                        {unread}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </main>
      <Footer />
    </div>
  );
}
