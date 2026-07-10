import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { markConversationReadAction } from "@/actions/messages";
import { formatDateShort, formatTime } from "@/lib/dates";
import { Header } from "@/components/layout/header";
import { Avatar } from "@/components/ui/avatar";
import { Icon } from "@/components/ui/icon";
import { MessageComposer } from "@/components/chat/message-composer";

export const dynamic = "force-dynamic";

export default async function ConversationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser(`/mensagens/${id}`);

  const convo = await prisma.conversation.findUnique({
    where: { id },
    include: {
      trip: { select: { id: true, originCity: true, destCity: true, departAt: true } },
      passenger: { select: { id: true, name: true, avatarUrl: true } },
      driver: { select: { id: true, name: true, avatarUrl: true } },
      messages: { orderBy: { createdAt: "asc" }, take: 200 },
    },
  });
  if (!convo || (convo.passengerId !== user.id && convo.driverId !== user.id)) notFound();

  await markConversationReadAction(id);
  const other = convo.passengerId === user.id ? convo.driver : convo.passenger;

  return (
    <div className="flex min-h-dvh flex-col">
      <Header />
      <div className="border-b border-line bg-sand-card">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3 sm:px-6">
          <Link href="/mensagens" aria-label="Voltar para mensagens" className="rounded-full p-2 hover:bg-ink/5">
            <Icon name="arrow-right" size={18} className="rotate-180" />
          </Link>
          <Avatar name={other.name} src={other.avatarUrl} size={40} />
          <div className="min-w-0">
            <p className="font-bold">{other.name}</p>
            <Link href={`/viagem/${convo.trip.id}`} className="text-xs font-semibold text-amber-deep hover:underline">
              {convo.trip.originCity} → {convo.trip.destCity} · {formatDateShort(convo.trip.departAt)}
            </Link>
          </div>
        </div>
      </div>

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 py-6 sm:px-6">
        <div className="flex-1 space-y-3">
          {convo.messages.length === 0 && (
            <p className="py-10 text-center text-sm text-ink/45">
              Diga oi e combine os detalhes do embarque por aqui. 👋
            </p>
          )}
          {convo.messages.map((m) => {
            const mine = m.senderId === user.id;
            return (
              <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-card ${
                    mine ? "rounded-br-md bg-ink text-sand-card" : "rounded-bl-md bg-sand-card text-ink"
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words">{m.body}</p>
                  <p className={`mt-1 text-right text-[10px] tabular-nums ${mine ? "text-sand-card/50" : "text-ink/40"}`}>
                    {formatTime(m.createdAt)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <MessageComposer conversationId={convo.id} />
      </main>
    </div>
  );
}
