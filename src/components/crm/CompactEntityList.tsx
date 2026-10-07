import Link from "next/link";
import { Badge } from "@/components/ui/Badge";

export type CompactEntityRow = {
  href: string;
  title: string;
  badge?: { status?: string; label: string };
  /** Одна строка под заголовком */
  meta?: string | null;
  /** Справа (город, ответственный) */
  trailing?: string | null;
};

export function CompactEntityList({ rows }: { rows: CompactEntityRow[] }) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <ul className="divide-y divide-slate-100">
        {rows.map((row) => (
          <li key={row.href}>
            <Link
              href={row.href}
              className="flex items-center gap-2 px-3 py-2.5 transition hover:bg-slate-50 active:bg-slate-100"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                  <span className="truncate text-sm font-medium text-slate-900">{row.title}</span>
                  {row.badge ? (
                    <Badge status={row.badge.status} className="shrink-0 text-[10px] px-1.5 py-0">
                      {row.badge.label}
                    </Badge>
                  ) : null}
                </div>
                {row.meta ? <p className="truncate text-xs text-slate-500">{row.meta}</p> : null}
              </div>
              {row.trailing ? (
                <span className="max-w-[38%] shrink-0 truncate text-right text-[11px] text-slate-400">
                  {row.trailing}
                </span>
              ) : null}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
