import Link from "next/link";
import { Badge } from "@/components/ui/Badge";

function chips(raw?: string | null) {
  if (!raw?.trim()) return [];
  return raw
    .split(/[,;|]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function ChipList({ items }: { items: string[] }) {
  if (items.length === 0) return <span className="text-slate-400">—</span>;
  return (
    <div className="flex flex-wrap gap-1">
      {items.map((item) => (
        <span
          key={item}
          className="rounded-full bg-teal-50 px-2 py-0.5 text-[11px] font-medium text-teal-900"
        >
          {item}
        </span>
      ))}
    </div>
  );
}

export function EntityCard({
  href,
  title,
  badge,
  lines,
}: {
  href: string;
  title: string;
  badge?: { status?: string; label: string };
  lines: { label: string; value?: string | null; chips?: string | null }[];
}) {
  return (
    <Link
      href={href}
      className="block rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-teal-300 hover:shadow-md"
    >
      <div className="mb-3 flex items-start justify-between gap-2">
        <h3 className="text-base font-semibold leading-snug text-slate-900">{title}</h3>
        {badge ? <Badge status={badge.status}>{badge.label}</Badge> : null}
      </div>
      <dl className="space-y-2 text-sm">
        {lines.map((line) => (
          <div key={line.label}>
            <dt className="text-[11px] uppercase tracking-wide text-slate-400">{line.label}</dt>
            <dd className="mt-0.5 text-slate-800">
              {line.chips != null ? <ChipList items={chips(line.chips)} /> : line.value || "—"}
            </dd>
          </div>
        ))}
      </dl>
    </Link>
  );
}

export function EntityCardGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{children}</div>;
}
