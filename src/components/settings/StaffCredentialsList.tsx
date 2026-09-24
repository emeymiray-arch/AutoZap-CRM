"use client";

import { useState } from "react";
import { Eye, EyeOff, Copy } from "lucide-react";
import { ROLE_LABELS } from "@/lib/labels";
import { Badge } from "@/components/ui/Badge";

type StaffRow = {
  id: string;
  name: string;
  email: string;
  role: string;
  adminPassword: string | null;
};

export function StaffCredentialsList({ users }: { users: StaffRow[] }) {
  return (
    <ul className="mb-4 space-y-3 text-sm">
      {users.map((u) => (
        <StaffCredentialRow key={u.id} user={u} />
      ))}
    </ul>
  );
}

function StaffCredentialRow({ user }: { user: StaffRow }) {
  const [showPass, setShowPass] = useState(false);
  const password = user.adminPassword || "—";

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      /* ignore */
    }
  }

  return (
    <li className="rounded-md border border-slate-100 bg-slate-50/80 p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="font-medium text-slate-900">{user.name}</div>
        <Badge>{ROLE_LABELS[user.role] || user.role}</Badge>
      </div>
      <div className="grid gap-1.5 text-xs text-slate-600">
        <div className="flex items-center gap-2">
          <span className="w-14 shrink-0 text-slate-400">Логин</span>
          <code className="flex-1 truncate rounded bg-white px-2 py-1 font-mono text-[12px] text-slate-800">
            {user.email}
          </code>
          <button
            type="button"
            className="rounded p-1 hover:bg-slate-200"
            title="Копировать логин"
            onClick={() => copy(user.email)}
          >
            <Copy className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-14 shrink-0 text-slate-400">Пароль</span>
          <code className="flex-1 truncate rounded bg-white px-2 py-1 font-mono text-[12px] text-slate-800">
            {showPass ? password : user.adminPassword ? "••••••••" : "—"}
          </code>
          {user.adminPassword && (
            <>
              <button
                type="button"
                className="rounded p-1 hover:bg-slate-200"
                title={showPass ? "Скрыть" : "Показать"}
                onClick={() => setShowPass((v) => !v)}
              >
                {showPass ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </button>
              <button
                type="button"
                className="rounded p-1 hover:bg-slate-200"
                title="Копировать пароль"
                onClick={() => copy(user.adminPassword!)}
              >
                <Copy className="h-3.5 w-3.5" />
              </button>
            </>
          )}
        </div>
      </div>
    </li>
  );
}
