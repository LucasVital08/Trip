"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { simulatePixPaymentAction } from "@/actions/booking";
import { formatBRL } from "@/lib/money";
import { FormError } from "@/components/ui/form";
import { Icon } from "@/components/ui/icon";

/** Painel Pix: copia-e-cola + (mock) botão de simular a confirmação. */
export function PixPanel({
  code,
  pixCopyPaste,
  totalCents,
}: {
  code: string;
  pixCopyPaste: string;
  totalCents: number;
}) {
  const [copied, setCopied] = useState(false);
  const [state, formAction, pending] = useActionState(simulatePixPaymentAction, {});
  const router = useRouter();

  return (
    <section className="mt-6 rounded-3xl border-2 border-amber bg-amber/8 p-6">
      <h2 className="flex items-center gap-2 text-lg font-bold">
        <Icon name="clock" size={20} className="text-amber-deep" />
        Pague {formatBRL(totalCents)} com Pix para confirmar
      </h2>
      <p className="mt-1.5 text-sm text-ink/65">
        Copie o código abaixo e cole no app do seu banco. Sua reserva fica
        garantida por 30 minutos.
      </p>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <code className="min-w-0 flex-1 truncate rounded-xl border border-line bg-sand-card px-3.5 py-3 font-mono text-xs text-ink/70">
          {pixCopyPaste}
        </code>
        <button
          type="button"
          onClick={async () => {
            await navigator.clipboard.writeText(pixCopyPaste);
            setCopied(true);
            setTimeout(() => setCopied(false), 2500);
          }}
          className="shrink-0 rounded-xl bg-ink px-5 py-3 text-sm font-bold text-sand-card transition hover:bg-ink-2"
        >
          {copied ? "Copiado ✓" : "Copiar código"}
        </button>
      </div>

      <form
        action={async (fd: FormData) => {
          formAction(fd);
          setTimeout(() => router.refresh(), 600);
        }}
        className="mt-4"
      >
        <input type="hidden" name="code" value={code} />
        <button
          type="submit"
          disabled={pending}
          className="text-sm font-semibold text-amber-deep underline underline-offset-4 hover:text-ink disabled:opacity-50"
        >
          {pending ? "Confirmando…" : "🔧 Ambiente de teste: simular pagamento recebido"}
        </button>
      </form>
      <FormError error={state.error} />
    </section>
  );
}
