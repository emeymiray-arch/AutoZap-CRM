"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Building2,
  Contact,
  Handshake,
  Kanban,
  Store,
  CheckSquare,
  Activity,
  BarChart3,
  Archive,
  Settings,
  Briefcase,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Role } from "@/lib/permissions";
import { canAccessSettings, canSeeAnalytics, canViewAll } from "@/lib/permissions";

const items: {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  group?: string;
  visible: (role: Role) => boolean;
}[] = [
  { href: "/dashboard", label: "Дашборд", icon: LayoutDashboard, visible: () => true },
  { href: "/crm/leads", label: "Лиды", icon: Users, group: "CRM", visible: () => true },
  { href: "/crm/companies", label: "Компании", icon: Building2, group: "CRM", visible: () => true },
  { href: "/crm/contacts", label: "Контакты", icon: Contact, group: "CRM", visible: () => true },
  { href: "/crm/deals", label: "Сделки", icon: Briefcase, group: "CRM", visible: () => true },
  { href: "/funnel", label: "Воронка", icon: Kanban, visible: () => true },
  { href: "/partners", label: "Партнёры", icon: Handshake, visible: () => true },
  { href: "/stores", label: "Магазины", icon: Store, visible: () => true },
  { href: "/tasks", label: "Задачи", icon: CheckSquare, visible: () => true },
  { href: "/activities", label: "Активности", icon: Activity, visible: () => true },
  { href: "/analytics", label: "Аналитика", icon: BarChart3, visible: canSeeAnalytics },
  { href: "/archive", label: "Архив", icon: Archive, visible: canViewAll },
  { href: "/settings", label: "Настройки", icon: Settings, visible: canAccessSettings },
];

export function Sidebar({
  role,
  onNavigate,
  mobile = false,
}: {
  role: Role;
  onNavigate?: () => void;
  mobile?: boolean;
}) {
  const pathname = usePathname();
  let lastGroup: string | undefined;
  const visibleItems = items.filter((item) => item.visible(role));

  return (
    <aside
      className={cn(
        "flex h-full w-56 shrink-0 flex-col border-r border-slate-200 bg-slate-950 text-slate-100",
        mobile && "w-full shadow-2xl",
      )}
    >
      <div className="flex items-center justify-between border-b border-slate-800 px-4 py-4">
        <div>
          <div className="text-lg font-semibold tracking-tight">AutoZap OS</div>
          <div className="text-[11px] text-slate-400">Операционная система</div>
        </div>
        {mobile && (
          <button
            type="button"
            onClick={onNavigate}
            className="rounded-md p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
            aria-label="Закрыть"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>
      <nav className="flex-1 space-y-0.5 overflow-y-auto overscroll-contain p-2">
        {visibleItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          const showGroup = item.group && item.group !== lastGroup;
          if (item.group) lastGroup = item.group;
          const Icon = item.icon;
          return (
            <div key={item.href}>
              {showGroup && (
                <div className="px-2.5 pb-1 pt-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                  {item.group}
                </div>
              )}
              <Link
                href={item.href}
                onClick={onNavigate}
                className={cn(
                  "flex min-h-11 items-center gap-2.5 rounded-md px-2.5 py-2.5 text-sm transition md:min-h-0 md:py-2",
                  active ? "bg-slate-800 text-white" : "text-slate-300 hover:bg-slate-900 hover:text-white",
                )}
              >
                <Icon className="h-4 w-4 shrink-0 opacity-80" />
                {item.label}
              </Link>
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
