"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Bell, Plus, Search, LogOut } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { markNotificationsReadAction } from "@/lib/actions";
import { signOut } from "next-auth/react";

type Notif = { id: string; title: string; body: string | null; link: string | null; readAt: Date | null };

export function Topbar({
  user,
  notifications,
}: {
  user: { name: string; email: string; role: string };
  notifications: Notif[];
}) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [openCreate, setOpenCreate] = useState(false);
  const [openNotif, setOpenNotif] = useState(false);
  const [pending, start] = useTransition();
  const unread = notifications.filter((n) => !n.readAt).length;

  function onSearch(e: React.FormEvent) {
    e.preventDefault();
    if (q.trim()) router.push(`/search?q=${encodeURIComponent(q.trim())}`);
  }

  return (
    <header className="flex h-14 items-center gap-3 border-b border-slate-200 bg-white px-4">
      <form onSubmit={onSearch} className="relative flex-1 max-w-xl">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Глобальный поиск: компания, телефон, ИНН, лид…"
          className="w-full rounded-md border border-slate-300 bg-slate-50 py-2 pl-9 pr-3 text-sm outline-none focus:border-slate-500 focus:bg-white"
        />
      </form>

      <div className="relative">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            setOpenNotif((v) => !v);
            if (unread) start(() => markNotificationsReadAction());
          }}
        >
          <Bell className="h-4 w-4" />
          {unread > 0 && (
            <span className="ml-1 rounded-full bg-rose-600 px-1.5 text-[10px] text-white">{unread}</span>
          )}
        </Button>
        {openNotif && (
          <div className="absolute right-0 z-40 mt-2 w-80 rounded-lg border border-slate-200 bg-white shadow-lg">
            <div className="border-b px-3 py-2 text-xs font-semibold text-slate-500">Уведомления</div>
            <div className="max-h-72 overflow-y-auto">
              {notifications.length === 0 && (
                <div className="p-4 text-sm text-slate-500">Нет уведомлений</div>
              )}
              {notifications.map((n) => (
                <Link
                  key={n.id}
                  href={n.link || "#"}
                  className="block border-b border-slate-100 px-3 py-2 hover:bg-slate-50"
                  onClick={() => setOpenNotif(false)}
                >
                  <div className="text-sm font-medium">{n.title}</div>
                  {n.body && <div className="text-xs text-slate-500">{n.body}</div>}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="relative">
        <Button size="sm" onClick={() => setOpenCreate((v) => !v)}>
          <Plus className="h-4 w-4" /> Создать
        </Button>
        {openCreate && (
          <div className="absolute right-0 z-40 mt-2 w-48 rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
            {[
              ["/crm/leads/new", "Лид"],
              ["/crm/companies/new", "Компания"],
              ["/crm/contacts/new", "Контакт"],
              ["/crm/deals/new", "Сделка"],
              ["/partners/new", "Партнёр"],
              ["/stores/new", "Магазин"],
              ["/tasks/new", "Задача"],
            ].map(([href, label]) => (
              <Link
                key={href}
                href={href}
                className="block px-3 py-2 text-sm hover:bg-slate-50"
                onClick={() => setOpenCreate(false)}
              >
                {label}
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 border-l border-slate-200 pl-3">
        <div className="text-right leading-tight">
          <div className="text-sm font-medium">{user.name}</div>
          <div className="text-[11px] text-slate-500">{user.role}</div>
        </div>
        <button
          type="button"
          disabled={pending}
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="rounded-md p-2 text-slate-500 hover:bg-slate-100"
          title="Выйти"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}
