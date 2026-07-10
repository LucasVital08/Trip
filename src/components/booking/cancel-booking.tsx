"use client";

import { useActionState, useState } from "react";
import { cancelBookingAction } from "@/actions/booking";
import { computeRefundCents } from "@/lib/pricing";
import { formatBRL } from "@/lib/money";
import { FormError, SubmitButton } from "@/components/ui/form";

export function CancelBookingButton({
  code,
  departAt,
  totalCents,
}: {
  code: string;
  departAt: string;
  totalCents: number;
}) {
  const [confirming, setConfirming] = useState(false);
  const [state, formAction] = useActionState(cancelBookingAction, {});
  const refund = computeRefundCents(totalCents, new Date(departAt), new Date());

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="rounded-full border border-red-800/25 px-5 py-2.5 text-sm font-semibold text-red-900 hover:bg-red-900/5"
      >
        Cancelar reserva
      </button>
    );
  }

  return (
    <div className="w-full rounded-2xl border border-red-800/20 bg-red-50/60 p-4">
      <p className="text-sm font-semibold text-red-950">
        Cancelar agora?{" "}
        {refund >= totalCents
          ? `Você recebe reembolso integral de ${formatBRL(refund)}.`
          : refund > 0
            ? `Pela antecedência, o reembolso é de ${formatBRL(refund)} (50%).`
            : "A menos de 3h da saída não há reembolso."}
      </p>
      <form action={formAction} className="mt-3 flex flex-wrap gap-2">
        <input type="hidden" name="code" value={code} />
        <SubmitButton variant="danger" pendingText="Cancelando…">
          Confirmar cancelamento
        </SubmitButton>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          className="rounded-full px-4 py-2 text-sm font-semibold text-ink/60 hover:bg-ink/5"
        >
          Voltar
        </button>
      </form>
      <FormError error={state.error} />
    </div>
  );
}
