"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

export function ViewTabs({
  cardsLabel = "Карточки",
  funnelLabel = "Воронка",
}: {
  cardsLabel?: string;
  funnelLabel?: string;
}) {
  const pathname = usePathname();
  const sp = useSearchParams();
  const view = sp.get("view") === "funnel" ? "funnel" : "cards";

  function href(next: "cards" | "funnel") {
    const params = new URLSearchParams(sp.toString());
    if (next === "cards") params.delete("view");
    else params.set("view", "funnel");
    const q = params.toString();
    return q ? `${pathname}?${q}` : pathname;
  }

  return (
    <div className="mb-4 flex gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1 w-fit">
      <Link
        href={href("cards")}
        className={cn(
          "rounded-md px-3 py-1.5 text-sm font-medium",
          view === "cards" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900",
        )}
      >
        {cardsLabel}
      </Link>
      <Link
        href={href("funnel")}
        className={cn(
          "rounded-md px-3 py-1.5 text-sm font-medium",
          view === "funnel" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900",
        )}
      >
        {funnelLabel}
      </Link>
    </div>
  );
}
