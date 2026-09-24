import { CITIES, parseCityList, withCurrentOptions } from "@/lib/geo";
import { cn } from "@/lib/utils";

/** Несколько городов из списка (склады / производство / магазины). */
export function MultiCityField({
  name,
  label,
  defaultValue = "",
  className,
}: {
  name: string;
  label: string;
  defaultValue?: string | null;
  className?: string;
}) {
  const selected = new Set(parseCityList(defaultValue));
  const options = withCurrentOptions(CITIES, [...selected]);

  return (
    <fieldset className={cn("md:col-span-2 space-y-1.5", className)}>
      <legend className="text-xs font-medium text-slate-600">{label}</legend>
      <div className="max-h-48 overflow-y-auto rounded-md border border-slate-200 bg-white p-2 grid grid-cols-2 gap-x-2 gap-y-1 sm:grid-cols-3">
        {options.map((city) => (
          <label
            key={city}
            className="flex cursor-pointer items-center gap-1.5 rounded px-1 py-1 text-xs text-slate-700 hover:bg-slate-50"
          >
            <input
              type="checkbox"
              name={name}
              value={city}
              defaultChecked={selected.has(city)}
              className="accent-slate-700"
            />
            <span className="truncate">{city}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
