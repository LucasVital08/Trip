"use client";

import { useActionState, useEffect, useRef } from "react";
import { sendMessageAction } from "@/actions/messages";
import { FormError } from "@/components/ui/form";
import { Icon } from "@/components/ui/icon";
import { useFormStatus } from "react-dom";

export function MessageComposer({ conversationId }: { conversationId: string }) {
  const [state, formAction] = useActionState(sendMessageAction, {});
  const formRef = useRef<HTMLFormElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, []);

  return (
    <>
      <div ref={endRef} />
      <form
        ref={formRef}
        action={async (fd) => {
          formAction(fd);
          formRef.current?.reset();
        }}
        className="sticky bottom-0 mt-6 flex items-end gap-2 rounded-2xl border border-line bg-sand-card p-2 shadow-card-hover"
      >
        <input type="hidden" name="conversationId" value={conversationId} />
        <textarea
          name="body"
          rows={1}
          required
          maxLength={2000}
          placeholder="Escreva sua mensagem…"
          aria-label="Mensagem"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              formRef.current?.requestSubmit();
            }
          }}
          className="max-h-32 min-h-[42px] flex-1 resize-y rounded-xl bg-sand px-3.5 py-2.5 text-sm placeholder:text-ink/35 focus:outline-none"
        />
        <SendButton />
      </form>
      <FormError error={state.error} />
    </>
  );
}

function SendButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-label="Enviar mensagem"
      className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-xl bg-amber text-ink transition hover:bg-amber-deep disabled:opacity-50"
    >
      <Icon name="arrow-right" size={18} />
    </button>
  );
}
