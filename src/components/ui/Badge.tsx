import { cn } from "@/lib/utils";
import { statusTone } from "@/lib/labels";

const toneClass = {
  success: "bg-emerald-50 text-emerald-800 border-emerald-200",
  warning: "bg-amber-50 text-amber-800 border-amber-200",
  error: "bg-rose-50 text-rose-800 border-rose-200",
  info: "bg-sky-50 text-sky-800 border-sky-200",
  neutral: "bg-slate-50 text-slate-700 border-slate-200",
};

export function Badge({
  children,
  status,
  className,
}: {
  children: React.ReactNode;
  status?: string;
  className?: string;
}) {
  const tone = status ? statusTone(status) : "neutral";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded border px-2 py-0.5 text-xs font-medium",
        toneClass[tone],
        className
      )}
    >
      {children}
    </span>
  );
}
