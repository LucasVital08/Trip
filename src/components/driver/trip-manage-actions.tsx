"use client";

import { useActionState } from "react";
import { cancelTripAction, completeTripAction } from "@/actions/trips";
import { FormError, SubmitButton } from "@/components/ui/form";

/** Ações do motorista sobre uma viagem: concluir (libera repasse) / cancelar. */
export function TripManageActions({
  tripId,
  canComplete = false,
  canCancel = false,
}: {
  tripId: string;
  canComplete?: boolean;
  canCancel?: boolean;
}) {
  const [completeState, completeAction] = useActionState(completeTripAction, {});
  const [cancelState, cancelAction] = useActionState(cancelTripAction, {});

  return (
    <div className="flex flex-wrap items-center gap-2">
      {canComplete && (
        <form action={completeAction}>
          <input type="hidden" name="tripId" value={tripId} />
          <SubmitButton variant="go" pendingText="Concluindo…">Marcar como concluída</SubmitButton>
        </form>
      )}
      {canCancel && (
        <form
          action={cancelAction}
          onSubmit={(e) => {
            if (!confirm("Cancelar esta viagem? Todos os passageiros serão reembolsados integralmente.")) {
              e.preventDefault();
            }
          }}
        >
          <input type="hidden" name="tripId" value={tripId} />
          <SubmitButton variant="danger" pendingText="Cancelando…">
            Cancelar viagem
          </SubmitButton>
        </form>
      )}
      <FormError error={completeState.error ?? cancelState.error} />
    </div>
  );
}
