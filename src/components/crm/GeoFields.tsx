import { Select } from "@/components/ui/Form";
import { CITIES, REGIONS, withCurrentOption } from "@/lib/geo";

export { MultiCityField } from "@/components/crm/MultiCityField";

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
