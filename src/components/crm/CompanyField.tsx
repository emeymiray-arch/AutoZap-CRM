import { companiesForSelect } from "@/lib/list-query";
import { Input } from "@/components/ui/Form";
import { cn } from "@/lib/utils";

/** Поле компании: ввод названия. Если такой нет — создаётся при сохранении формы. */
export async function CompanyField({
  label = "Компания",
  defaultName = "",
  required = false,
  className,
  hint = "Введите название. Новая компания создастся сама; существующая подставится по имени.",
}: {
  label?: string;
  defaultName?: string;
  required?: boolean;
  className?: string;
  hint?: string;
}) {
  const companies = await companiesForSelect();
  const listId = "az-company-suggestions";

  return (
    <div className={cn("space-y-1", className)}>
      <Input
        name="companyName"
        label={label}
        required={required}
        defaultValue={defaultName}
        list={listId}
        placeholder="Название компании"
        autoComplete="organization"
      />
      <datalist id={listId}>
        {companies.map((c) => (
          <option key={c.id} value={c.name} />
        ))}
      </datalist>
      {hint ? <p className="text-[11px] leading-snug text-slate-500">{hint}</p> : null}
    </div>
  );
}
