"use client";

import { useActionState, useEffect, useState } from "react";
import type { VehicleCategory } from "@prisma/client";
import { publishTripAction } from "@/actions/trips";
import { deriveTier, TIER_LABEL } from "@/lib/tier";
import { formatBRL } from "@/lib/money";
import { todayInputValue, tomorrowInputValue } from "@/lib/dates";
import { CityAutocomplete, type CityOption } from "@/components/search/city-autocomplete";
import { PlaceAutocomplete } from "@/components/maps/place-autocomplete";
import { Field, FormError, SubmitButton, inputCls } from "@/components/ui/form";
import { Icon } from "@/components/ui/icon";

interface VehicleOpt {
  id: string;
  label: string;
  seats: number;
  year: number;
  category: VehicleCategory;
}

interface AmenityOpt {
  slug: string;
  label: string;
  icon: string;
  description: string | null;
  tierWeight: number;
}

export function PublishTripForm({
  vehicles,
  amenities,
  feePercent,
}: {
  vehicles: VehicleOpt[];
  amenities: AmenityOpt[];
  feePercent: number;
}) {
  const [state, formAction] = useActionState(publishTripAction, {});
  const v = state.values ?? {};
  const [vehicleId, setVehicleId] = useState(vehicles[0].id);
  const [selected, setSelected] = useState<Set<string>>(new Set(["nao-fumante"]));
  const [originSlug, setOriginSlug] = useState("");
  const [destSlug, setDestSlug] = useState("");
  const [originCity, setOriginCity] = useState<CityOption | null>(null);
  const [destCity, setDestCity] = useState<CityOption | null>(null);
  const [seats, setSeats] = useState(Math.min(3, vehicles[0].seats));
  const [priceBRL, setPriceBRL] = useState("");
  const [suggestion, setSuggestion] = useState<{
    distanceKm: number;
    durationMin: number;
    lowCents: number;
    highCents: number;
  } | null>(null);

  const vehicle = vehicles.find((v) => v.id === vehicleId) ?? vehicles[0];
  const tier = deriveTier({
    amenityWeights: amenities.filter((a) => selected.has(a.slug)).map((a) => a.tierWeight),
    vehicleYear: vehicle.year,
    vehicleCategory: vehicle.category,
  });

  const routeReady = Boolean(originSlug && destSlug && originSlug !== destSlug);

  // sugestão de preço quando origem+destino definidos
  useEffect(() => {
    if (!routeReady) return;
    const ctrl = new AbortController();
    fetch(
      `/api/price-suggestion?origem=${originSlug}&destino=${destSlug}&assentos=${seats}`,
      { signal: ctrl.signal }
    )
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.suggestion) {
          setSuggestion({
            distanceKm: data.distanceKm,
            durationMin: data.durationMin,
            lowCents: data.suggestion.lowCents,
            highCents: data.suggestion.highCents,
          });
        }
      })
      .catch(() => {});
    return () => ctrl.abort();
  }, [routeReady, originSlug, destSlug, seats]);

  // só exibe a sugestão com rota válida selecionada (evita valor obsoleto)
  const activeSuggestion = routeReady ? suggestion : null;
  const priceCents = Math.round(Number(priceBRL.replace(",", ".")) * 100) || 0;

  return (
    <form action={formAction} className="mt-8 space-y-6">
      {/* rota */}
      <section className="space-y-4 rounded-3xl border border-line bg-sand-card p-6 shadow-card">
        <h2 className="text-sm font-bold uppercase tracking-wider text-ink/50">Rota e horário</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <CityAutocomplete
            name="originSlug"
            label="Saindo de"
            placeholder="Ex.: Recife"
            required
            onSelect={(city) => {
              setOriginSlug(city?.slug ?? "");
              setOriginCity(city);
            }}
          />
          <CityAutocomplete
            name="destSlug"
            label="Indo para"
            placeholder="Ex.: Caruaru"
            required
            onSelect={(city) => {
              setDestSlug(city?.slug ?? "");
              setDestCity(city);
            }}
          />
          <Field label="Data da viagem" htmlFor="pub-date">
            <input
              id="pub-date"
              type="date"
              name="departDate"
              min={todayInputValue()}
              defaultValue={v.departDate ?? tomorrowInputValue()}
              required
              className={inputCls}
            />
          </Field>
          <Field label="Horário de saída" htmlFor="pub-time">
            <input id="pub-time" type="time" name="departTime" defaultValue={v.departTime ?? "07:00"} required className={inputCls} />
          </Field>
          <div className="sm:col-span-2">
            <PlaceAutocomplete
              name="meetingPoint"
              placeIdName="meetingPlaceId"
              sessionTokenName="meetingSessionToken"
              label="Ponto de embarque"
              hint="Pesquise um lugar público ou escreva instruções adicionais."
              placeholder="Ex.: Parque do Derby, Recife"
              defaultValue={v.meetingPoint}
              required
              bias={originCity}
            />
          </div>
          <div className="sm:col-span-2">
            <PlaceAutocomplete
              name="dropoffPoint"
              placeIdName="dropoffPlaceId"
              sessionTokenName="dropoffSessionToken"
              label="Ponto de desembarque (opcional)"
              placeholder="Ex.: Rodoviária de Caruaru"
              defaultValue={v.dropoffPoint}
              bias={destCity}
            />
          </div>
        </div>
        {activeSuggestion && (
          <p className="flex items-center gap-2 rounded-2xl bg-sand px-4 py-3 text-sm text-ink/65">
            <Icon name="route" size={16} className="shrink-0 text-amber-deep" />
            Rota estimada: {activeSuggestion.distanceKm} km ·{" "}
            {Math.floor(activeSuggestion.durationMin / 60)}h{String(activeSuggestion.durationMin % 60).padStart(2, "0")} de estrada
          </p>
        )}
      </section>

      {/* carro e assentos */}
      <section className="space-y-4 rounded-3xl border border-line bg-sand-card p-6 shadow-card">
        <h2 className="text-sm font-bold uppercase tracking-wider text-ink/50">Carro e assentos</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Veículo" htmlFor="pub-vehicle">
            <select
              id="pub-vehicle"
              name="vehicleId"
              value={vehicleId}
              onChange={(e) => {
                setVehicleId(e.target.value);
                const v = vehicles.find((x) => x.id === e.target.value);
                if (v) setSeats((s) => Math.min(s, v.seats));
              }}
              className={inputCls}
            >
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>{v.label}</option>
              ))}
            </select>
          </Field>
          <Field label="Assentos ofertados" htmlFor="pub-seats" hint={`Máximo ${vehicle.seats} neste carro.`}>
            <input
              id="pub-seats"
              type="number"
              name="seats"
              min={1}
              max={vehicle.seats}
              value={seats}
              onChange={(e) => setSeats(Number(e.target.value))}
              required
              className={inputCls}
            />
          </Field>
        </div>
      </section>

      {/* opcionais */}
      <section className="rounded-3xl border border-line bg-sand-card p-6 shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-bold uppercase tracking-wider text-ink/50">Opcionais da viagem</h2>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber/15 px-3 py-1 text-xs font-bold text-amber-deep">
            <Icon name="sparkle" size={13} />
            Faixa resultante: {TIER_LABEL[tier]}
          </span>
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {amenities.map((a) => {
            const on = selected.has(a.slug);
            return (
              <label
                key={a.slug}
                className={`flex cursor-pointer items-start gap-3 rounded-2xl border-2 px-3.5 py-3 transition ${
                  on ? "border-amber-deep bg-amber/8" : "border-line bg-sand hover:border-ink/20"
                }`}
              >
                <input
                  type="checkbox"
                  name="amenities"
                  value={a.slug}
                  checked={on}
                  onChange={() =>
                    setSelected((prev) => {
                      const next = new Set(prev);
                      if (next.has(a.slug)) next.delete(a.slug);
                      else next.add(a.slug);
                      return next;
                    })
                  }
                  className="sr-only"
                />
                <Icon name={a.icon} size={18} className={`mt-0.5 shrink-0 ${on ? "text-amber-deep" : "text-ink/40"}`} />
                <span>
                  <span className="block text-sm font-bold">{a.label}</span>
                  {a.description && <span className="block text-xs text-ink/55">{a.description}</span>}
                </span>
              </label>
            );
          })}
        </div>
      </section>

      {/* preço */}
      <section className="space-y-4 rounded-3xl border border-line bg-sand-card p-6 shadow-card">
        <h2 className="text-sm font-bold uppercase tracking-wider text-ink/50">Preço por assento</h2>
        {activeSuggestion && (
          <p className="rounded-2xl bg-amber/10 px-4 py-3 text-sm leading-relaxed text-ink/75">
            💡 <strong>Sugestão para esta rota:</strong> entre {formatBRL(activeSuggestion.lowCents)} e{" "}
            {formatBRL(activeSuggestion.highCents)} — do rateio de custos a uma experiência
            completa. <strong>É só referência: o preço é seu.</strong>
          </p>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Valor por assento (R$)" htmlFor="pub-price">
            <input
              id="pub-price"
              name="price"
              inputMode="decimal"
              placeholder="45,00"
              value={priceBRL}
              onChange={(e) => setPriceBRL(e.target.value)}
              required
              className={inputCls}
            />
          </Field>
          {priceCents > 0 && (
            <div className="rounded-2xl bg-sand px-4 py-3 text-sm">
              <p className="flex justify-between text-ink/65">
                <span>Passageiro paga</span>
                <strong className="tabular-nums">{formatBRL(Math.round(priceCents * (1 + feePercent / 100)))}</strong>
              </p>
              <p className="mt-1 flex justify-between text-ink/65">
                <span>Você recebe (integral)</span>
                <strong className="tabular-nums text-trust">{formatBRL(priceCents)}</strong>
              </p>
              <p className="mt-1.5 text-xs text-ink/45">A taxa Trip ({feePercent}%) é somada ao valor do passageiro.</p>
            </div>
          )}
        </div>
      </section>

      {/* recado */}
      <section className="rounded-3xl border border-line bg-sand-card p-6 shadow-card">
        <label htmlFor="pub-notes" className="text-sm font-bold uppercase tracking-wider text-ink/50">
          Recado da viagem
        </label>
        <textarea
          id="pub-notes"
          name="notes"
          rows={3}
          maxLength={500}
          defaultValue={v.notes}
          placeholder='Ex.: "Pego a BR-232 sem pressa, parada rápida pra café no meio do caminho. Curto conversa boa!"'
          className="mt-3 w-full rounded-xl border border-line bg-sand px-3.5 py-2.5 text-sm placeholder:text-ink/35"
        />
        <p className="mt-1.5 text-xs text-ink/45">
          O recado aparece na página da viagem e dá o tom da experiência.
        </p>
      </section>

      <FormError error={state.error} />
      <SubmitButton className="w-full py-3.5 text-base" pendingText="Publicando…">
        Publicar viagem
      </SubmitButton>
    </form>
  );
}
