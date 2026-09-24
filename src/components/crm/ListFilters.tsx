"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Input, Select } from "@/components/ui/Form";
import { Button } from "@/components/ui/Button";
import { FilterBar } from "@/components/layout/Page";
import { saveFilterAction } from "@/lib/actions";

export function ListFilters({
  statusOptions,
  users,
  entityType,
  savedFilters,
  showSource,
  showRegion,
  showDeadline,
  stageOptions,
}: {
  statusOptions?: { value: string; label: string }[];
  stageOptions?: { value: string; label: string }[];
  users: { id: string; name: string }[];
  entityType: string;
  savedFilters?: { id: string; name: string; query: string }[];
  showSource?: boolean;
  showRegion?: boolean;
  showDeadline?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  function setParam(key: string, value: string) {
    const next = new URLSearchParams(sp.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    router.push(`${pathname}?${next.toString()}`);
  }

  return (
    <FilterBar>
      <Input
        label="Поиск"
        defaultValue={sp.get("q") || ""}
        placeholder="Поиск…"
        onBlur={(e) => setParam("q", e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") setParam("q", (e.target as HTMLInputElement).value);
        }}
      />
      {statusOptions && (
        <Select
          label="Статус"
          defaultValue={sp.get("status") || ""}
          onChange={(e) => setParam("status", e.target.value)}
        >
          <option value="">Все</option>
          {statusOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>
      )}
      {stageOptions && (
        <Select
          label="Этап"
          defaultValue={sp.get("stage") || ""}
          onChange={(e) => setParam("stage", e.target.value)}
        >
          <option value="">Все</option>
          {stageOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>
      )}
      <Select
        label="Ответственный"
        defaultValue={sp.get("responsibleId") || ""}
        onChange={(e) => setParam("responsibleId", e.target.value)}
      >
        <option value="">Все</option>
        {users.map((u) => (
          <option key={u.id} value={u.id}>
            {u.name}
          </option>
        ))}
      </Select>
      {showRegion && (
        <Input
          label="Регион"
          defaultValue={sp.get("region") || ""}
          onBlur={(e) => setParam("region", e.target.value)}
        />
      )}
      {showSource && (
        <Input
          label="Источник"
          defaultValue={sp.get("source") || ""}
          onBlur={(e) => setParam("source", e.target.value)}
        />
      )}
      <Input
        label="Создано с"
        type="date"
        defaultValue={sp.get("from") || ""}
        onChange={(e) => setParam("from", e.target.value)}
      />
      <Input
        label="по"
        type="date"
        defaultValue={sp.get("to") || ""}
        onChange={(e) => setParam("to", e.target.value)}
      />
      {showDeadline && (
        <Select
          label="Дедлайн"
          defaultValue={sp.get("deadline") || ""}
          onChange={(e) => setParam("deadline", e.target.value)}
        >
          <option value="">Любой</option>
          <option value="today">Сегодня</option>
          <option value="overdue">Просрочено</option>
        </Select>
      )}
      {savedFilters && savedFilters.length > 0 && (
        <Select
          label="Сохранённые"
          defaultValue=""
          onChange={(e) => {
            if (e.target.value) router.push(`${pathname}?${e.target.value}`);
          }}
        >
          <option value="">Выбрать…</option>
          {savedFilters.map((f) => (
            <option key={f.id} value={f.query}>
              {f.name}
            </option>
          ))}
        </Select>
      )}
      <form
        action={async (fd) => {
          fd.set("entityType", entityType);
          fd.set("query", sp.toString());
          await saveFilterAction(fd);
        }}
        className="flex items-end gap-2"
      >
        <Input name="name" label="Сохранить как" placeholder="Мои лиды" />
        <Button type="submit" variant="secondary" size="sm">
          Сохранить фильтр
        </Button>
      </form>
      <Button href={pathname} variant="ghost" size="sm">
        Сбросить
      </Button>
    </FilterBar>
  );
}
