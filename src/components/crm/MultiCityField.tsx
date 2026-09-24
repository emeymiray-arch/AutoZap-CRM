"use client";

import { useMemo, useState } from "react";
import { CITIES, parseCityList, withCurrentOptions } from "@/lib/geo";
import { cn } from "@/lib/utils";

/** Несколько городов: выбранные чипы + поиск, можно добавить сколько угодно */
export function MultiCityField({
  name,
  label,
  defaultValue = "",
  className,
  hint = "Можно указать несколько городов — введите и нажмите «Добавить» или Enter",
}: {
  name: string;
  label: string;
  defaultValue?: string | null;
  className?: string;
  hint?: string;
}) {
  const initial = parseCityList(defaultValue);
  const [selected, setSelected] = useState<string[]>(initial);
  const [query, setQuery] = useState("");
  const listId = `az-cities-${name}`;

  const suggestions = useMemo(() => {
    const pool = withCurrentOptions(CITIES, selected);
    const q = query.trim().toLowerCase();
    if (!q) return pool.slice(0, 40);
    return pool.filter((c) => c.toLowerCase().includes(q)).slice(0, 40);
  }, [query, selected]);

  function addCity(raw: string) {
    const city = raw.trim();
    if (!city) return;
    setSelected((prev) => (prev.some((c) => c.toLowerCase() === city.toLowerCase()) ? prev : [...prev, city]));
    setQuery("");
  }

  function removeCity(city: string) {
    setSelected((prev) => prev.filter((c) => c !== city));
  }

  return (
    <fieldset className={cn("md:col-span-2 space-y-1.5", className)}>
      <legend className="text-xs font-medium text-slate-600">{label}</legend>
      {hint ? <p className="text-[11px] text-slate-500">{hint}</p> : null}

      {selected.map((city) => (
        <input key={city} type="hidden" name={name} value={city} />
      ))}

      {selected.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {selected.map((city) => (
            <button
              key={city}
              type="button"
              onClick={() => removeCity(city)}
              className="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-white px-2 py-1 text-xs text-slate-800 hover:border-rose-300 hover:bg-rose-50"
              title="Убрать"
            >
              {city}
              <span className="text-slate-400" aria-hidden>
                ×
              </span>
            </button>
          ))}
        </div>
      ) : (
        <p className="text-xs text-slate-400">Пока не выбрано</p>
      )}

      <div className="flex gap-2">
        <input
          list={listId}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addCity(query);
            }
          }}
          placeholder="Город…"
          className="min-w-0 flex-1 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-500"
          autoComplete="off"
        />
        <datalist id={listId}>
          {suggestions.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
        <button
          type="button"
          onClick={() => addCity(query)}
          className="shrink-0 rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
        >
          Добавить
        </button>
      </div>
    </fieldset>
  );
}
