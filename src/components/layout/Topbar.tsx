"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Bell, Plus, Search, LogOut, Menu } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { markNotificationsReadAction } from "@/lib/actions";
import { signOut } from "next-auth/react";

type Notif = { id: string; title: string; body: string | null; link: string | null; readAt: Date | null };

export function Topbar({
  user,
  notifications,
  onMenuClick,
}: {
  user: { name: string; email: string; role: string };
  notifications: Notif[];
  onMenuClick?: () => void;
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

  function closePopovers() {
    setOpenCreate(false);
    setOpenNotif(false);
  }

  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 border-b border-slate-200 bg-white px-2 sm:gap-3 sm:px-4">
      <button
        type="button"
        onClick={onMenuClick}
        className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-slate-700 hover:bg-slate-100 md:hidden"
        aria-label="Открыть меню"
      >
        <Menu className="h-5 w-5" />
      </button>

      <form onSubmit={onSearch} className="relative min-w-0 flex-1 max-w-xl">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Поиск…"
          className="w-full rounded-md border border-slate-300 bg-slate-50 py-2 pl-9 pr-3 text-sm outline-none focus:border-slate-500 focus:bg-white sm:placeholder:text-slate-400"
        />
      </form>

      <div className="relative shrink-0">
        <Button
          variant="secondary"
          size="sm"
          className="h-10 w-10 px-0 sm:h-auto sm:w-auto sm:px-2.5"
          onClick={() => {
            setOpenCreate(false);
            setOpenNotif((v) => !v);
            if (unread) start(() => markNotificationsReadAction());
          }}
        >
          <Bell className="h-4 w-4" />
          {unread > 0 && (
            <span className="absolute -right-1 -top-1 rounded-full bg-rose-600 px-1.5 text-[10px] text-white sm:static sm:ml-1">
              {unread}
            </span>
          )}
        </Button>
        {openNotif && (
          <>
            <button type="button" className="fixed inset-0 z-30" aria-label="Закрыть" onClick={closePopovers} />
            <div className="absolute right-0 z-40 mt-2 w-[min(20rem,calc(100vw-1rem))] rounded-lg border border-slate-200 bg-white shadow-lg">
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
                    onClick={closePopovers}
                  >
                    <div className="text-sm font-medium">{n.title}</div>
                    {n.body && <div className="text-xs text-slate-500">{n.body}</div>}
                  </Link>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      <div className="relative shrink-0">
        <Button
          size="sm"
          className="h-10 px-2.5 sm:h-auto"
          onClick={() => {
            setOpenNotif(false);
            setOpenCreate((v) => !v);
          }}
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Создать</span>
        </Button>
        {openCreate && (
          <>
            <button type="button" className="fixed inset-0 z-30" aria-label="Закрыть" onClick={closePopovers} />
            <div className="absolute right-0 z-40 mt-2 w-48 rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
              {[
                ["/partners/new", "Партнёр"],
                ["/stores/new", "Магазин"],
                ["/crm/leads/new", "Лид"],
                ["/crm/contacts/new", "Контакт"],
                ["/crm/deals/new", "Сделка"],
                ["/tasks/new", "Задача"],
              ].map(([href, label]) => (
                <Link
                  key={href}
                  href={href}
                  className="block px-3 py-2.5 text-sm hover:bg-slate-50"
                  onClick={closePopovers}
                >
                  {label}
                </Link>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-1 border-l border-slate-200 pl-2 sm:gap-2 sm:pl-3">
        <div className="hidden text-right leading-tight sm:block">
          <div className="max-w-[9rem] truncate text-sm font-medium">{user.name}</div>
          <div className="max-w-[9rem] truncate text-[11px] text-slate-500">{user.role}</div>
        </div>
        <button
          type="button"
          disabled={pending}
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="inline-flex h-10 w-10 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100"
          title="Выйти"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}
