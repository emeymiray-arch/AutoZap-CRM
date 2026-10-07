"use client";

import { useState } from "react";
import { Select } from "@/components/ui/Form";

export function TaskAssigneeFields({
  canAssignOthers,
  users,
  currentUserId,
}: {
  canAssignOthers: boolean;
  users: { id: string; name: string }[];
  currentUserId: string;
}) {
  const [mode, setMode] = useState<"self" | "colleague" | "all">("self");

  if (!canAssignOthers) {
    return <input type="hidden" name="assignMode" value="self" />;
  }

  return (
    <div className="space-y-3 rounded-md border border-slate-200 bg-slate-50 p-3">
      <div className="text-xs font-medium text-slate-600">Кому поставить</div>
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        {(
          [
            ["self", "Себе"],
            ["colleague", "Коллеге"],
            ["all", "Всей команде"],
          ] as const
        ).map(([value, label]) => (
          <label
            key={value}
            className={`flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm ${
              mode === value
                ? "border-slate-900 bg-white font-medium"
                : "border-slate-200 bg-white text-slate-600"
            }`}
          >
            <input
              type="radio"
              name="assignMode"
              value={value}
              checked={mode === value}
              onChange={() => setMode(value)}
              className="accent-slate-900"
            />
            {label}
          </label>
        ))}
      </div>
      {mode === "colleague" && (
        <Select name="responsibleId" label="Сотрудник" required defaultValue="">
          <option value="" disabled>
            Выберите…
          </option>
          {users
            .filter((u) => u.id !== currentUserId)
            .map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
        </Select>
      )}
    </div>
  );
}
