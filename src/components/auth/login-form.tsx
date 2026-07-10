"use client";

import { useActionState } from "react";
import { googleLoginAction, loginAction } from "@/actions/auth";
import { Field, FormError, SubmitButton, inputCls } from "@/components/ui/form";

export function LoginForm({ callbackUrl, showGoogle }: { callbackUrl?: string; showGoogle: boolean }) {
  const [state, formAction] = useActionState(loginAction, {});

  return (
    <div className="space-y-4">
      <form action={formAction} className="space-y-4">
        <input type="hidden" name="callbackUrl" value={callbackUrl ?? "/"} />
        <Field label="E-mail" htmlFor="login-email">
          <input id="login-email" name="email" type="email" autoComplete="email" required className={inputCls} placeholder="voce@email.com" />
        </Field>
        <Field label="Senha" htmlFor="login-password">
          <input id="login-password" name="password" type="password" autoComplete="current-password" required className={inputCls} placeholder="••••••••" />
        </Field>
        <FormError error={state.error} />
        <SubmitButton className="w-full" pendingText="Entrando…">
          Entrar
        </SubmitButton>
      </form>
      {showGoogle && (
        <form action={googleLoginAction}>
          <button
            type="submit"
            className="w-full rounded-full border border-line bg-sand-card px-5 py-2.5 text-sm font-bold text-ink transition hover:bg-sand"
          >
            Continuar com Google
          </button>
        </form>
      )}
    </div>
  );
}
