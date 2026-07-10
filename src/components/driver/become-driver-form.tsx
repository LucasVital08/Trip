"use client";

import { useActionState } from "react";
import { becomeDriverAction } from "@/actions/driver";
import { Field, FormError, SubmitButton, inputCls } from "@/components/ui/form";

export function BecomeDriverForm({
  defaultName,
  defaultPhone,
}: {
  defaultName: string;
  defaultPhone: string;
}) {
  const [state, formAction] = useActionState(becomeDriverAction, {});

  return (
    <form action={formAction} className="space-y-5 rounded-3xl border border-line bg-sand-card p-6 shadow-card sm:p-8">
      <h2 className="text-lg font-bold" style={{ fontFamily: "var(--font-display)" }}>
        Verificação de identidade
      </h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Field label="Nome completo (como no documento)" htmlFor="drv-name">
            <input id="drv-name" name="fullName" defaultValue={defaultName} required className={inputCls} />
          </Field>
        </div>
        <Field label="CPF" htmlFor="drv-cpf" hint="Ambiente de teste: qualquer CPF matematicamente válido é aprovado.">
          <input id="drv-cpf" name="cpf" inputMode="numeric" placeholder="000.000.000-00" required className={inputCls} />
        </Field>
        <Field label="Telefone (com DDD)" htmlFor="drv-phone">
          <input id="drv-phone" name="phone" type="tel" defaultValue={defaultPhone} placeholder="(81) 99999-0000" required className={inputCls} />
        </Field>
        <Field label="Número da CNH" htmlFor="drv-cnh">
          <input id="drv-cnh" name="cnhNumber" inputMode="numeric" placeholder="00000000000" required className={inputCls} />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Categoria" htmlFor="drv-cat">
            <select id="drv-cat" name="cnhCategory" defaultValue="B" className={inputCls}>
              {["A", "B", "AB", "C", "D", "E"].map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </Field>
          <Field label="Validade da CNH" htmlFor="drv-exp">
            <input id="drv-exp" name="cnhExpiresAt" type="date" required className={inputCls} />
          </Field>
        </div>
      </div>

      <div className="rounded-2xl bg-sand px-4 py-3.5 text-sm leading-relaxed text-ink/60">
        📸 Em produção, esta etapa pede foto do documento e uma selfie com prova
        de vida via provedor de KYC. No ambiente de demonstração a verificação é
        simulada e aprovada na hora.
      </div>

      <FormError error={state.error} />
      <SubmitButton className="w-full sm:w-auto" pendingText="Verificando…">
        Enviar verificação
      </SubmitButton>
    </form>
  );
}
