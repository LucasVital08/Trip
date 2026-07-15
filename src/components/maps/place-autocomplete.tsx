"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Icon } from "@/components/ui/icon";

interface PlaceOption {
  placeId: string;
  label: string;
  mainText: string;
  secondaryText?: string;
}

export function PlaceAutocomplete({
  name,
  placeIdName,
  sessionTokenName,
  label,
  hint,
  placeholder,
  defaultValue,
  required,
  bias,
}: {
  name: string;
  placeIdName: string;
  sessionTokenName: string;
  label: string;
  hint?: string;
  placeholder?: string;
  defaultValue?: string;
  required?: boolean;
  bias?: { lat: number; lng: number } | null;
}) {
  const id = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const debounce = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [sessionToken] = useState(() => crypto.randomUUID());
  const [query, setQuery] = useState(defaultValue ?? "");
  const [placeId, setPlaceId] = useState("");
  const [options, setOptions] = useState<PlaceOption[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);

  useEffect(() => {
    function close(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  function search(value: string) {
    clearTimeout(debounce.current);
    debounce.current = setTimeout(async () => {
      if (value.trim().length < 3) {
        setOptions([]);
        return;
      }
      const params = new URLSearchParams({ q: value, session: sessionToken });
      if (bias) {
        params.set("lat", String(bias.lat));
        params.set("lng", String(bias.lng));
      }
      try {
        const response = await fetch(`/api/places?${params}`, { cache: "no-store" });
        const data = (await response.json()) as { places?: PlaceOption[] };
        setOptions(data.places ?? []);
        setOpen(Boolean(data.places?.length));
        setActive(-1);
      } catch {
        setOptions([]);
      }
    }, 250);
  }

  function choose(place: PlaceOption) {
    setQuery(place.label);
    setPlaceId(place.placeId);
    setOpen(false);
  }

  return (
    <div ref={rootRef} className="relative">
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold text-ink/80">
        {label}
      </label>
      <div className="relative">
        <Icon name="pin" size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-amber-deep" />
        <input
          id={id}
          name={name}
          value={query}
          required={required}
          autoComplete="off"
          role="combobox"
          aria-expanded={open}
          aria-controls={`${id}-list`}
          aria-autocomplete="list"
          placeholder={placeholder}
          onChange={(event) => {
            const value = event.target.value;
            setQuery(value);
            setPlaceId("");
            search(value);
          }}
          onFocus={() => options.length > 0 && setOpen(true)}
          onKeyDown={(event) => {
            if (!open) return;
            if (event.key === "ArrowDown") {
              event.preventDefault();
              setActive((value) => Math.min(value + 1, options.length - 1));
            } else if (event.key === "ArrowUp") {
              event.preventDefault();
              setActive((value) => Math.max(0, value - 1));
            } else if (event.key === "Enter" && active >= 0) {
              event.preventDefault();
              choose(options[active]);
            } else if (event.key === "Escape") {
              setOpen(false);
            }
          }}
          className="w-full rounded-xl border border-line bg-sand-card py-2.5 pl-10 pr-3.5 text-sm text-ink placeholder:text-ink/35 focus:border-amber-deep focus:outline-none focus:ring-2 focus:ring-amber/40"
        />
      </div>
      <input type="hidden" name={placeIdName} value={placeId} />
      <input type="hidden" name={sessionTokenName} value={sessionToken} suppressHydrationWarning />
      {hint && <p className="mt-1.5 text-xs text-ink/45">{hint}</p>}
      {open && options.length > 0 && (
        <div className="absolute z-30 mt-1 w-full overflow-hidden rounded-xl border border-line bg-sand-card shadow-card-hover">
          <ul id={`${id}-list`} role="listbox">
            {options.map((place, index) => (
              <li key={place.placeId} role="option" aria-selected={index === active}>
                <button
                  type="button"
                  onMouseDown={(event) => {
                    event.preventDefault();
                    choose(place);
                  }}
                  onMouseEnter={() => setActive(index)}
                  className={`flex w-full items-start gap-2 px-3.5 py-2.5 text-left text-sm ${index === active ? "bg-amber/15" : ""}`}
                >
                  <Icon name="pin" size={14} className="mt-0.5 shrink-0 text-ink/40" />
                  <span>
                    <span className="block font-medium">{place.mainText}</span>
                    {place.secondaryText && <span className="block text-xs text-ink/50">{place.secondaryText}</span>}
                  </span>
                </button>
              </li>
            ))}
          </ul>
          <p className="border-t border-line px-3 py-1.5 text-right text-[10px] font-semibold tracking-wide text-ink/40">
            Powered by Google
          </p>
        </div>
      )}
    </div>
  );
}
