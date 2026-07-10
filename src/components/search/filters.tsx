import { Icon } from "@/components/ui/icon";
import { TIER_LABEL } from "@/lib/tier";

/**
 * Filtros da busca — form GET server-rendered (funciona sem JS).
 * Opcionais (AND), faixa de experiência, teto de preço e ordenação.
 */
export function Filters({
  amenities,
  current,
  passthrough,
}: {
  amenities: Array<{ slug: string; label: string; icon: string }>;
  current: { opcionais: string[]; faixa: string[]; precoMax?: number; ordenar: string };
  passthrough: { origem?: string; destino?: string; data?: string };
}) {
  return (
    <aside aria-label="Filtros">
      <form method="GET" action="/buscar" className="space-y-6 rounded-3xl border border-line bg-sand-card p-5 shadow-card lg:sticky lg:top-20">
        {passthrough.origem && <input type="hidden" name="origem" value={passthrough.origem} />}
        {passthrough.destino && <input type="hidden" name="destino" value={passthrough.destino} />}
        {passthrough.data && <input type="hidden" name="data" value={passthrough.data} />}

        <div>
          <label htmlFor="ordenar" className="mb-2 block text-sm font-bold">
            Ordenar por
          </label>
          <select
            id="ordenar"
            name="ordenar"
            defaultValue={current.ordenar}
            className="w-full rounded-xl border border-line bg-sand px-3 py-2.5 text-sm font-medium"
          >
            <option value="recomendado">Recomendado</option>
            <option value="preco">Menor preço</option>
            <option value="avaliacao">Melhor avaliação</option>
            <option value="horario">Horário de saída</option>
          </select>
        </div>

        <fieldset>
          <legend className="mb-2 text-sm font-bold">Faixa de experiência</legend>
          <div className="space-y-1.5">
            {(["ECONOMICO", "CONFORTO", "PREMIUM"] as const).map((tier) => (
              <label key={tier} className="flex cursor-pointer items-center gap-2.5 rounded-lg px-1 py-1 text-sm font-medium text-ink/80">
                <input
                  type="checkbox"
                  name="faixa"
                  value={tier}
                  defaultChecked={current.faixa.includes(tier)}
                  className="h-4 w-4 rounded border-line accent-amber-deep"
                />
                {TIER_LABEL[tier]}
              </label>
            ))}
          </div>
        </fieldset>

        <div>
          <label htmlFor="precoMax" className="mb-2 block text-sm font-bold">
            Preço máximo por pessoa
          </label>
          <div className="flex items-center gap-3">
            <input
              id="precoMax"
              type="range"
              name="precoMax"
              min={0}
              max={300}
              step={10}
              defaultValue={current.precoMax ?? 300}
              className="w-full"
              aria-describedby="precoMax-hint"
            />
          </div>
          <p id="precoMax-hint" className="mt-1 flex justify-between text-xs text-ink/50">
            <span>R$ 10</span>
            <span>R$ 300 (sem teto)</span>
          </p>
        </div>

        <fieldset>
          <legend className="mb-2 text-sm font-bold">Opcionais da viagem</legend>
          <div className="space-y-1.5">
            {amenities.map((a) => (
              <label key={a.slug} className="flex cursor-pointer items-center gap-2.5 rounded-lg px-1 py-1 text-sm font-medium text-ink/80">
                <input
                  type="checkbox"
                  name="opcionais"
                  value={a.slug}
                  defaultChecked={current.opcionais.includes(a.slug)}
                  className="h-4 w-4 rounded border-line accent-amber-deep"
                />
                <Icon name={a.icon} size={15} className="text-amber-deep" />
                {a.label}
              </label>
            ))}
          </div>
        </fieldset>

        <button
          type="submit"
          className="w-full rounded-full bg-ink px-4 py-2.5 text-sm font-bold text-sand-card transition hover:bg-ink-2"
        >
          Aplicar filtros
        </button>
      </form>
    </aside>
  );
}
