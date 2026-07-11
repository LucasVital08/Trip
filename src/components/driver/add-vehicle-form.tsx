"use client";

import { useActionState, useState } from "react";
import { addVehicleAction } from "@/actions/driver";
import { Field, FormError, FormSuccess, SubmitButton, inputCls } from "@/components/ui/form";

export function AddVehicleForm({ firstVehicle }: { firstVehicle: boolean }) {
  const [open, setOpen] = useState(firstVehicle);
  const [state, formAction] = useActionState(addVehicleAction, {});
  const v = state.values ?? {};

  if (!open) {
    return (
      <div className="space-y-3">
        <FormSuccess show={state.ok}>Veículo cadastrado!</FormSuccess>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded-full border border-line px-5 py-2.5 text-sm font-bold text-ink/75 hover:bg-ink/5"
        >
          + Adicionar veículo
        </button>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-5 rounded-3xl border border-line bg-sand-card p-6 shadow-card">
      <h2 className="text-lg font-bold" style={{ fontFamily: "var(--font-display)" }}>
        {firstVehicle ? "Cadastre seu carro" : "Novo veículo"}
      </h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Marca" htmlFor="veh-brand">
          <input id="veh-brand" name="brand" required placeholder="Chevrolet" defaultValue={v.brand} className={inputCls} />
        </Field>
        <Field label="Modelo" htmlFor="veh-model">
          <input id="veh-model" name="model" required placeholder="Onix" defaultValue={v.model} className={inputCls} />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Ano" htmlFor="veh-year">
            <input id="veh-year" name="year" type="number" min={1990} max={new Date().getFullYear() + 1} required placeholder="2021" defaultValue={v.year} className={inputCls} />
          </Field>
          <Field label="Cor" htmlFor="veh-color">
            <input id="veh-color" name="color" required placeholder="Prata" defaultValue={v.color} className={inputCls} />
          </Field>
        </div>
        <Field label="Placa" htmlFor="veh-plate">
          <input id="veh-plate" name="plate" required placeholder="ABC1D23" defaultValue={v.plate} className={`${inputCls} uppercase`} />
        </Field>
        <Field label="Categoria" htmlFor="veh-cat">
          <select id="veh-cat" name="category" defaultValue={v.category ?? "HATCH"} className={inputCls}>
            <option value="HATCH">Hatch</option>
            <option value="SEDAN">Sedã</option>
            <option value="SUV">SUV</option>
            <option value="MINIVAN">Minivan</option>
            <option value="PICKUP">Picape</option>
          </select>
        </Field>
        <Field label="Lugares para passageiros" htmlFor="veh-seats" hint="Sem contar o banco do motorista.">
          <input id="veh-seats" name="seats" type="number" min={1} max={7} defaultValue={v.seats ?? 4} required className={inputCls} />
        </Field>
      </div>
      <FormError error={state.error} />
      <div className="flex gap-3">
        <SubmitButton pendingText="Salvando…">Salvar veículo</SubmitButton>
        {!firstVehicle && (
          <button type="button" onClick={() => setOpen(false)} className="rounded-full px-4 py-2 text-sm font-semibold text-ink/60 hover:bg-ink/5">
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}
