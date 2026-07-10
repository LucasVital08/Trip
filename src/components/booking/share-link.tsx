"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/icon";

/** Link público de acompanhamento em tempo real (segurança). */
export function ShareTripLink({ shareUrl }: { shareUrl: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <section className="mt-4 rounded-3xl border border-trust/30 bg-trust/6 p-6">
      <h2 className="flex items-center gap-2 text-base font-bold text-trust">
        <Icon name="share" size={18} />
        Compartilhe a viagem com quem confia em você
      </h2>
      <p className="mt-1.5 text-sm leading-relaxed text-ink/65">
        Envie este link para um contato de confiança acompanhar sua viagem:
        rota, horários, carro e motorista — sem precisar de conta.
      </p>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <code className="min-w-0 flex-1 truncate rounded-xl border border-line bg-sand-card px-3.5 py-2.5 font-mono text-xs text-ink/70">
          {shareUrl}
        </code>
        <button
          type="button"
          onClick={async () => {
            if (navigator.share) {
              try {
                await navigator.share({ title: "Acompanhe minha viagem no Trip", url: shareUrl });
                return;
              } catch {
                /* usuário cancelou — cai no clipboard */
              }
            }
            await navigator.clipboard.writeText(shareUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2500);
          }}
          className="shrink-0 rounded-xl bg-trust px-5 py-2.5 text-sm font-bold text-sand-card transition hover:opacity-90"
        >
          {copied ? "Copiado ✓" : "Compartilhar"}
        </button>
      </div>
    </section>
  );
}
