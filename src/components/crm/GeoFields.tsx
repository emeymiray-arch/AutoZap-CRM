import { Select } from "@/components/ui/Form";
import { CITIES, REGIONS, parseCityList, withCurrentOption, withCurrentOptions } from "@/lib/geo";
import { cn } from "@/lib/utils";

export function RegionSelect({
  name = "region",
  label = "Регион",
  defaultValue = "",
  required = false,
  className,
}: {
  name?: string;
  label?: string;
  defaultValue?: string | null;
  required?: boolean;
  className?: string;
}) {
  const options = withCurrentOption(REGIONS, defaultValue);
  return (
    <Select
      name={name}
      label={label}
      required={required}
      defaultValue={defaultValue || ""}
      className={className}
    >
      <option value="">—</option>
      {options.map((r) => (
        <option key={r} value={r}>
          {r}
        </option>
      ))}
    </Select>
  );
}

export function CitySelect({
  name = "city",
  label = "Город",
  defaultValue = "",
  required = false,
  className,
}: {
  name?: string;
  label?: string;
  defaultValue?: string | null;
  required?: boolean;
  className?: string;
}) {
  const options = withCurrentOption(CITIES, defaultValue);
  return (
    <Select
      name={name}
      label={label}
      required={required}
      defaultValue={defaultValue || ""}
      className={className}
    >
      <option value="">—</option>
      {options.map((c) => (
        <option key={c} value={c}>
          {c}
        </option>
      ))}
    </Select>
  );
}

/** Несколько городов (склады / производство) — чекбоксы из списка */
export function MultiCityField({
  name,
  label,
  defaultValue = "",
  className,
  hint = "Можно отметить несколько городов",
}: {
  name: string;
  label: string;
  defaultValue?: string | null;
  className?: string;
  hint?: string;
}) {
  const selected = new Set(parseCityList(defaultValue));
  const options = withCurrentOptions(CITIES, [...selected]);

  return (
    <fieldset className={cn("md:col-span-2 space-y-1.5", className)}>
      <legend className="text-xs font-medium text-slate-600">{label}</legend>
      {hint ? <p className="text-[11px] text-slate-500">{hint}</p> : null}
      <div className="max-h-44 overflow-y-auto rounded-md border border-slate-200 bg-slate-50/80 p-2 grid grid-cols-2 gap-x-2 gap-y-1 sm:grid-cols-3">
        {options.map((city) => (
          <label
            key={city}
            className="flex cursor-pointer items-center gap-1.5 rounded px-1 py-0.5 text-xs text-slate-700 hover:bg-white"
          >
            <input
              type="checkbox"
              name={name}
              value={city}
              defaultChecked={selected.has(city)}
              className="rounded border-slate-300"
            />
            <span className="truncate">{city}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
