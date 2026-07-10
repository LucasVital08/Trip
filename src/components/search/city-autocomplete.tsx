"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Icon } from "@/components/ui/icon";

export interface CityOption {
  name: string;
  state: string;
  slug: string;
}

/**
 * Combobox de cidades com autocomplete (GET /api/cities).
 * Envia o slug num input hidden (`name`) e mostra "Cidade, UF" no visível.
 */
export function CityAutocomplete({
  name,
  label,
  placeholder,
  defaultValue,
  defaultLabel,
  required,
  onSelect,
}: {
  name: string;
  label: string;
  placeholder?: string;
  defaultValue?: string; // slug
  defaultLabel?: string; // "Recife, PE"
  required?: boolean;
  onSelect?: (city: CityOption | null) => void;
}) {
  const id = useId();
  const [query, setQuery] = useState(defaultLabel ?? "");
  const [slug, setSlug] = useState(defaultValue ?? "");
  const [options, setOptions] = useState<CityOption[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const rootRef = useRef<HTMLDivElement>(null);
  const debounce = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  function search(q: string) {
    clearTimeout(debounce.current);
    debounce.current = setTimeout(async () => {
      if (q.trim().length < 2) {
        setOptions([]);
        return;
      }
      try {
        const res = await fetch(`/api/cities?q=${encodeURIComponent(q)}`);
        const data = (await res.json()) as { cities: CityOption[] };
        setOptions(data.cities);
        setOpen(true);
        setActive(-1);
      } catch {
        setOptions([]);
      }
    }, 160);
  }

  function choose(city: CityOption) {
    setQuery(`${city.name}, ${city.state}`);
    setSlug(city.slug);
    setOpen(false);
    onSelect?.(city);
  }

  return (
    <div ref={rootRef} className="relative">
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold text-ink/80">
        {label}
      </label>
      <div className="relative">
        <Icon
          name="pin"
          size={16}
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-amber-deep"
        />
        <input
          id={id}
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-controls={`${id}-list`}
          aria-autocomplete="list"
          autoComplete="off"
          required={required}
          placeholder={placeholder}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setSlug("");
            onSelect?.(null);
            search(e.target.value);
          }}
          onFocus={() => options.length > 0 && setOpen(true)}
          onKeyDown={(e) => {
            if (!open) return;
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setActive((a) => Math.min(a + 1, options.length - 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setActive((a) => Math.max(a - 1, 0));
            } else if (e.key === "Enter" && active >= 0) {
              e.preventDefault();
              choose(options[active]);
            } else if (e.key === "Escape") {
              setOpen(false);
            }
          }}
          className="w-full rounded-xl border border-line bg-sand-card py-2.5 pl-10 pr-3.5 text-sm text-ink placeholder:text-ink/35 focus:border-amber-deep focus:outline-none focus:ring-2 focus:ring-amber/40"
        />
      </div>
      <input type="hidden" name={name} value={slug} />
      {open && options.length > 0 && (
        <ul
          id={`${id}-list`}
          role="listbox"
          className="absolute z-30 mt-1 w-full overflow-hidden rounded-xl border border-line bg-sand-card shadow-card-hover"
        >
          {options.map((c, i) => (
            <li key={c.slug} role="option" aria-selected={i === active}>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  choose(c);
                }}
                onMouseEnter={() => setActive(i)}
                className={`flex w-full items-center gap-2 px-3.5 py-2.5 text-left text-sm ${
                  i === active ? "bg-amber/15" : ""
                }`}
              >
                <Icon name="pin" size={14} className="text-ink/40" />
                <span className="font-medium">{c.name}</span>
                <span className="text-ink/45">{c.state}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
