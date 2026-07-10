import { Icon } from "@/components/ui/icon";
import { CityAutocomplete } from "./city-autocomplete";
import { todayInputValue, tomorrowInputValue } from "@/lib/dates";

/**
 * Formulário de busca (GET /buscar). Server-friendly: funciona sem JS além
 * do autocomplete. `compact` = versão para o topo da página de resultados.
 */
export function SearchForm({
  compact = false,
  defaults,
}: {
  compact?: boolean;
  defaults?: { origem?: string; origemLabel?: string; destino?: string; destinoLabel?: string; data?: string };
}) {
  return (
    <form
      action="/buscar"
      method="GET"
      className={`grid gap-3 ${compact ? "sm:grid-cols-[1fr_1fr_auto_auto]" : "sm:grid-cols-2 lg:grid-cols-[1fr_1fr_auto_auto]"} items-end`}
    >
      <CityAutocomplete
        name="origem"
        label="Saindo de"
        placeholder="Ex.: Recife"
        defaultValue={defaults?.origem}
        defaultLabel={defaults?.origemLabel}
      />
      <CityAutocomplete
        name="destino"
        label="Indo para"
        placeholder="Ex.: Caruaru"
        defaultValue={defaults?.destino}
        defaultLabel={defaults?.destinoLabel}
      />
      <div>
        <label htmlFor="search-date" className="mb-1.5 block text-sm font-semibold text-ink/80">
          Data
        </label>
        <input
          id="search-date"
          type="date"
          name="data"
          defaultValue={defaults?.data ?? tomorrowInputValue()}
          min={todayInputValue()}
          className="w-full rounded-xl border border-line bg-sand-card px-3.5 py-2.5 text-sm text-ink focus:border-amber-deep focus:outline-none focus:ring-2 focus:ring-amber/40"
        />
      </div>
      <button
        type="submit"
        className="inline-flex h-[42px] items-center justify-center gap-2 rounded-xl bg-amber px-6 text-sm font-bold text-ink transition hover:bg-amber-deep"
      >
        <Icon name="search" size={16} />
        Buscar
      </button>
    </form>
  );
}
