"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import type { Role } from "@/lib/permissions";

type Notif = {
  id: string;
  title: string;
  body: string | null;
  link: string | null;
  readAt: Date | null;
};

export function AppShell({
  role,
  user,
  notifications,
  children,
}: {
  role: Role;
  user: { name: string; email: string; role: string };
  notifications: Notif[];
  children: React.ReactNode;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [menuOpen]);

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-slate-100">
      {/* Desktop sidebar */}
      <div className="hidden md:flex">
        <Sidebar role={role} />
      </div>

      {/* Mobile drawer */}
      <div
        className={`fixed inset-0 z-50 md:hidden ${menuOpen ? "pointer-events-auto" : "pointer-events-none"}`}
        aria-hidden={!menuOpen}
      >
        <button
          type="button"
          className={`absolute inset-0 bg-slate-950/50 transition-opacity ${menuOpen ? "opacity-100" : "opacity-0"}`}
          onClick={() => setMenuOpen(false)}
          aria-label="Закрыть меню"
        />
        <div
          className={`absolute inset-y-0 left-0 flex w-[min(18rem,88vw)] transform transition-transform duration-200 ease-out ${
            menuOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <Sidebar role={role} onNavigate={() => setMenuOpen(false)} mobile />
        </div>
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          user={user}
          notifications={notifications}
          onMenuClick={() => setMenuOpen(true)}
        />
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
