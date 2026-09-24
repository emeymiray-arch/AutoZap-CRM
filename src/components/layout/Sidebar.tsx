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
  FileSpreadsheet,
  CheckSquare,
  Activity,
  BarChart3,
  Archive,
  Settings,
  Briefcase,
} from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/dashboard", label: "Дашборд", icon: LayoutDashboard },
  { href: "/crm/leads", label: "Лиды", icon: Users, group: "CRM" },
  { href: "/crm/companies", label: "Компании", icon: Building2, group: "CRM" },
  { href: "/crm/contacts", label: "Контакты", icon: Contact, group: "CRM" },
  { href: "/crm/deals", label: "Сделки", icon: Briefcase, group: "CRM" },
  { href: "/funnel", label: "Воронка", icon: Kanban },
  { href: "/partners", label: "Партнёры", icon: Handshake },
  { href: "/catalogs", label: "Каталоги", icon: FileSpreadsheet },
  { href: "/stores", label: "Магазины", icon: Store },
  { href: "/tasks", label: "Задачи", icon: CheckSquare },
  { href: "/activities", label: "Активности", icon: Activity },
  { href: "/analytics", label: "Аналитика", icon: BarChart3 },
  { href: "/archive", label: "Архив", icon: Archive },
  { href: "/settings", label: "Настройки", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  let lastGroup: string | undefined;

  return (
    <aside className="flex h-full w-56 shrink-0 flex-col border-r border-slate-200 bg-slate-950 text-slate-100">
      <div className="border-b border-slate-800 px-4 py-4">
        <div className="text-lg font-semibold tracking-tight">AutoZap OS</div>
        <div className="text-[11px] text-slate-400">Операционная система</div>
      </div>
      <nav className="flex-1 space-y-0.5 overflow-y-auto p-2">
        {items.map((item) => {
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
                className={cn(
                  "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition",
                  active ? "bg-slate-800 text-white" : "text-slate-300 hover:bg-slate-900 hover:text-white"
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
