import { Select } from "@/components/ui/Form";
import { REGIONS, withCurrentOption } from "@/lib/geo";

export { MultiCityField } from "@/components/crm/MultiCityField";

/** Единый список регионов РФ — везде один и тот же */
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

/** То же, что RegionSelect (единый список). name по умолчанию city. */
export function CitySelect({
  name = "city",
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
  return (
    <RegionSelect
      name={name}
      label={label}
      defaultValue={defaultValue}
      required={required}
      className={className}
    />
  );
}
