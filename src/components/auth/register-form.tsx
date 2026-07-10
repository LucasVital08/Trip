"use client";

import { useActionState } from "react";
import { registerAction } from "@/actions/auth";
import { Field, FormError, SubmitButton, inputCls } from "@/components/ui/form";

export function RegisterForm() {
  const [state, formAction] = useActionState(registerAction, {});

  return (
    <form action={formAction} className="space-y-4">
      <Field label="Nome completo" htmlFor="reg-name">
        <input id="reg-name" name="name" autoComplete="name" required className={inputCls} placeholder="Maria da Silva" />
      </Field>
      <Field label="E-mail" htmlFor="reg-email">
        <input id="reg-email" name="email" type="email" autoComplete="email" required className={inputCls} placeholder="voce@email.com" />
      </Field>
      <Field label="Senha" htmlFor="reg-password" hint="Mínimo de 6 caracteres.">
        <input id="reg-password" name="password" type="password" autoComplete="new-password" required minLength={6} className={inputCls} placeholder="••••••••" />
      </Field>
      <FormError error={state.error} />
      <SubmitButton className="w-full" pendingText="Criando conta…">
        Criar conta
      </SubmitButton>
      <p className="text-center text-xs leading-relaxed text-ink/50">
        Ao criar a conta você concorda com os{" "}
        <a href="/termos" className="underline">Termos de uso</a> e a{" "}
        <a href="/privacidade" className="underline">Política de privacidade</a>.
      </p>
    </form>
  );
}
