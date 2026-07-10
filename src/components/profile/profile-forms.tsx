"use client";

import { useActionState } from "react";
import { updateDriverBioAction } from "@/actions/driver";
import { saveSafetyContactAction } from "@/actions/safety";
import { Field, FormError, FormSuccess, SubmitButton, inputCls } from "@/components/ui/form";
import { Icon } from "@/components/ui/icon";

export function ProfileForms({
  bio,
  safetyContactName,
  safetyContactPhone,
}: {
  bio: string;
  safetyContactName: string;
  safetyContactPhone: string;
}) {
  const [bioState, bioAction] = useActionState(updateDriverBioAction, {});
  const [safetyState, safetyAction] = useActionState(saveSafetyContactAction, {});

  return (
    <div className="mt-8 space-y-6">
      <section className="rounded-3xl border border-line bg-sand-card p-6 shadow-card">
        <h2 className="text-lg font-bold" style={{ fontFamily: "var(--font-display)" }}>Sobre você</h2>
        <p className="mt-1 text-sm text-ink/55">
          Sua bio aparece no seu perfil público e nas suas viagens.
        </p>
        <form action={bioAction} className="mt-4 space-y-3">
          <textarea
            name="bio"
            rows={3}
            maxLength={500}
            defaultValue={bio}
            placeholder="Ex.: Faço Recife–Caruaru toda semana. Dirijo com calma, curto um bom papo…"
            className="w-full rounded-xl border border-line bg-sand px-3.5 py-2.5 text-sm placeholder:text-ink/35"
          />
          <FormError error={bioState.error} />
          <FormSuccess show={bioState.ok}>Bio atualizada.</FormSuccess>
          <SubmitButton variant="dark" pendingText="Salvando…">Salvar bio</SubmitButton>
        </form>
      </section>

      <section className="rounded-3xl border border-trust/30 bg-sand-card p-6 shadow-card">
        <h2 className="flex items-center gap-2 text-lg font-bold text-trust" style={{ fontFamily: "var(--font-display)" }}>
          <Icon name="shield" size={20} />
          Contato de segurança
        </h2>
        <p className="mt-1 text-sm leading-relaxed text-ink/55">
          Pessoa que recebe o link de acompanhamento das suas viagens e é
          referenciada pelo botão de emergência.
        </p>
        <form action={safetyAction} className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Nome" htmlFor="safety-name">
            <input id="safety-name" name="name" defaultValue={safetyContactName} required className={inputCls} placeholder="Ex.: Mainha" />
          </Field>
          <Field label="Telefone (com DDD)" htmlFor="safety-phone">
            <input id="safety-phone" name="phone" type="tel" defaultValue={safetyContactPhone} required className={inputCls} placeholder="(81) 99999-0000" />
          </Field>
          <div className="sm:col-span-2 space-y-3">
            <FormError error={safetyState.error} />
            <FormSuccess show={safetyState.ok}>Contato de segurança salvo.</FormSuccess>
            <SubmitButton pendingText="Salvando…">Salvar contato</SubmitButton>
          </div>
        </form>
      </section>
    </div>
  );
}
