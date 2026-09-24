import { Input } from "@/components/ui/Form";
import { CITIES } from "@/lib/geo";
import { cn } from "@/lib/utils";

/** Несколько городов: ввод через запятую (склады / производство / магазины). */
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
  const listId = `az-cities-${name}`;
  return (
    <div className={cn("md:col-span-2", className)}>
      <Input
        name={name}
        label={label}
        defaultValue={defaultValue || ""}
        list={listId}
        placeholder="Москва, Казань, Самара"
        autoComplete="off"
      />
      <datalist id={listId}>
        {CITIES.map((c) => (
          <option key={c} value={c} />
        ))}
      </datalist>
    </div>
  );
}
