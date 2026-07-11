"use client";

import { useActionState, useState } from "react";
import { createBookingAction } from "@/actions/booking";
import { computeBookingPrice } from "@/lib/pricing";
import { formatBRL } from "@/lib/money";
import { FormError, SubmitButton } from "@/components/ui/form";
import { Icon } from "@/components/ui/icon";

/**
 * Checkout: assentos + método (Pix/cartão). O breakdown de preço (valor do
 * motorista + taxa Trip) é recalculado no cliente para exibição e SEMPRE
 * revalidado no servidor. Cartão em modo mock: os dados nunca saem do
 * navegador — só um token simulado (últimos 4 dígitos) vai ao servidor.
 */
export function CheckoutForm({
  tripId,
  pricePerSeatCents,
  maxSeats,
  feePercent,
}: {
  tripId: string;
  pricePerSeatCents: number;
  maxSeats: number;
  feePercent: number;
}) {
  const [seats, setSeats] = useState(1);
  const [method, setMethod] = useState<"PIX" | "CARD">("PIX");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExp, setCardExp] = useState("");
  const [cardCvc, setCardCvc] = useState("");
  const [state, formAction] = useActionState(createBookingAction, {});

  const price = computeBookingPrice(pricePerSeatCents, seats, feePercent, 0);

  return (
    <form action={formAction} className="mt-6 space-y-6">
      <input type="hidden" name="tripId" value={tripId} />
      <input type="hidden" name="seats" value={seats} />
      <input type="hidden" name="method" value={method} />
      {method === "CARD" && (
        <input type="hidden" name="cardToken" value={`tok_mock_${cardNumber.replace(/\s/g, "").slice(-4)}`} />
      )}

      {/* assentos */}
      <section className="rounded-3xl border border-line bg-sand-card p-5 shadow-card">
        <h2 className="text-sm font-bold uppercase tracking-wider text-ink/50">Assentos</h2>
        <div className="mt-3 flex items-center gap-4">
          <button
            type="button"
            onClick={() => setSeats((s) => Math.max(1, s - 1))}
            disabled={seats <= 1}
            aria-label="Menos um assento"
            className="flex h-11 w-11 items-center justify-center rounded-full border border-line text-xl font-bold disabled:opacity-30"
          >
            −
          </button>
          <span className="min-w-10 text-center text-2xl font-extrabold tabular-nums" aria-live="polite">
            {seats}
          </span>
          <button
            type="button"
            onClick={() => setSeats((s) => Math.min(maxSeats, s + 1))}
            disabled={seats >= maxSeats}
            aria-label="Mais um assento"
            className="flex h-11 w-11 items-center justify-center rounded-full border border-line text-xl font-bold disabled:opacity-30"
          >
            +
          </button>
          <p className="text-sm text-ink/55">
            {maxSeats} {maxSeats === 1 ? "disponível" : "disponíveis"} nesta viagem
          </p>
        </div>
      </section>

      {/* pagamento */}
      <section className="rounded-3xl border border-line bg-sand-card p-5 shadow-card">
        <h2 className="text-sm font-bold uppercase tracking-wider text-ink/50">Pagamento</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Método de pagamento">
          <MethodOption
            active={method === "PIX"}
            onClick={() => setMethod("PIX")}
            icon="sparkle"
            title="Pix"
            desc="Confirmação em segundos"
          />
          <MethodOption
            active={method === "CARD"}
            onClick={() => setMethod("CARD")}
            icon="wallet"
            title="Cartão de crédito"
            desc="Aprovação na hora"
          />
        </div>

        {method === "CARD" && (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="card-number" className="mb-1.5 block text-sm font-semibold text-ink/80">
                Número do cartão
              </label>
              <input
                id="card-number"
                inputMode="numeric"
                autoComplete="cc-number"
                placeholder="4242 4242 4242 4242"
                value={cardNumber}
                onChange={(e) => setCardNumber(e.target.value)}
                required
                className="w-full rounded-xl border border-line bg-sand px-3.5 py-2.5 text-sm tabular-nums"
              />
              <p className="mt-1 text-xs text-ink/45">
                Modo teste: qualquer número é aprovado, exceto final <strong>0002</strong> (recusado).
              </p>
            </div>
            <div>
              <label htmlFor="card-exp" className="mb-1.5 block text-sm font-semibold text-ink/80">Validade</label>
              <input id="card-exp" placeholder="12/29" autoComplete="cc-exp" value={cardExp} onChange={(e) => setCardExp(e.target.value)} required className="w-full rounded-xl border border-line bg-sand px-3.5 py-2.5 text-sm" />
            </div>
            <div>
              <label htmlFor="card-cvc" className="mb-1.5 block text-sm font-semibold text-ink/80">CVC</label>
              <input id="card-cvc" placeholder="123" inputMode="numeric" autoComplete="cc-csc" value={cardCvc} onChange={(e) => setCardCvc(e.target.value)} required className="w-full rounded-xl border border-line bg-sand px-3.5 py-2.5 text-sm" />
            </div>
          </div>
        )}
        {method === "PIX" && (
          <p className="mt-4 flex items-start gap-2 rounded-2xl bg-sand px-4 py-3 text-sm text-ink/65">
            <Icon name="clock" size={16} className="mt-0.5 shrink-0 text-amber-deep" />
            Você recebe o código copia-e-cola na próxima tela. A reserva fica
            garantida por 30 minutos enquanto o pagamento é confirmado.
          </p>
        )}
      </section>

      {/* resumo */}
      <section className="rounded-3xl border border-line bg-sand-card p-5 shadow-card">
        <h2 className="text-sm font-bold uppercase tracking-wider text-ink/50">Resumo</h2>
        <dl className="mt-3 space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-ink/65">
              Valor do motorista ({seats} {seats === 1 ? "assento" : "assentos"})
            </dt>
            <dd className="font-semibold tabular-nums">{formatBRL(price.subtotalCents)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-ink/65">Taxa de serviço Trip ({feePercent}%)</dt>
            <dd className="font-semibold tabular-nums">{formatBRL(price.serviceFeeCents)}</dd>
          </div>
          <div className="road-stripe-subtle" />
          <div className="flex justify-between text-base">
            <dt className="font-bold">Total</dt>
            <dd className="font-extrabold tabular-nums">{formatBRL(price.totalCents)}</dd>
          </div>
        </dl>
        <p className="mt-3 text-xs leading-relaxed text-ink/50">
          O Trip intermedia o pagamento: o valor fica retido e é repassado ao
          motorista após a viagem. Reembolso integral em cancelamentos com 24h+
          de antecedência; 50% entre 24h e 3h; sem reembolso a menos de 3h.
        </p>
      </section>

      <FormError error={state.error} />

      <SubmitButton className="w-full py-3.5 text-base" pendingText="Processando…">
        {method === "PIX" ? "Gerar Pix e reservar" : `Pagar ${formatBRL(price.totalCents)}`}
      </SubmitButton>
    </form>
  );
}

function MethodOption({
  active,
  onClick,
  icon,
  title,
  desc,
}: {
  active: boolean;
  onClick: () => void;
  icon: string;
  title: string;
  desc: string;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      onClick={onClick}
      className={`flex items-center gap-3 rounded-2xl border-2 px-4 py-3 text-left transition ${
        active ? "border-amber-deep bg-amber/10" : "border-line bg-sand hover:border-ink/25"
      }`}
    >
      <Icon name={icon} size={20} className={active ? "text-amber-deep" : "text-ink/40"} />
      <span>
        <span className="block text-sm font-bold">{title}</span>
        <span className="block text-xs text-ink/55">{desc}</span>
      </span>
    </button>
  );
}
