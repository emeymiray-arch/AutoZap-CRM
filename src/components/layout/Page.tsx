import { format } from "date-fns";
import { ru } from "date-fns/locale";

export function formatDate(d?: Date | string | null) {
  if (!d) return "—";
  return format(new Date(d), "dd.MM.yyyy", { locale: ru });
}

export function formatDateTime(d?: Date | string | null) {
  if (!d) return "—";
  return format(new Date(d), "dd.MM.yyyy HH:mm", { locale: ru });
}

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-slate-900">{title}</h1>
        {description && <p className="mt-0.5 text-sm text-slate-500">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Card({
  children,
  className = "",
  title,
}: {
  children: React.ReactNode;
  className?: string;
  title?: string;
}) {
  return (
    <div className={`rounded-lg border border-slate-200 bg-white ${className}`}>
      {title && (
        <div className="border-b border-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-800">
          {title}
        </div>
      )}
      <div className="p-4">{children}</div>
    </div>
  );
}

export function FilterBar({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-3 flex flex-wrap items-end gap-2 rounded-lg border border-slate-200 bg-white p-3">
      {children}
    </div>
  );
}
