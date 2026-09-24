import { cn } from "@/lib/utils";

export function Input({
  className,
  label,
  required,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label?: string }) {
  return (
    <label className="block space-y-1">
      {label && (
        <span className="text-xs font-medium text-slate-600">
          {label}
          {required ? <span className="text-rose-600"> *</span> : null}
        </span>
      )}
      <input
        className={cn(
          "w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-500",
          className
        )}
        required={required}
        {...props}
      />
    </label>
  );
}

export function Textarea({
  className,
  label,
  required,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string }) {
  return (
    <label className="block space-y-1">
      {label && (
        <span className="text-xs font-medium text-slate-600">
          {label}
          {required ? <span className="text-rose-600"> *</span> : null}
        </span>
      )}
      <textarea
        className={cn(
          "w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-500 min-h-24",
          className
        )}
        required={required}
        {...props}
      />
    </label>
  );
}

export function Select({
  className,
  label,
  required,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string }) {
  return (
    <label className="block space-y-1">
      {label && (
        <span className="text-xs font-medium text-slate-600">
          {label}
          {required ? <span className="text-rose-600"> *</span> : null}
        </span>
      )}
      <select
        className={cn(
          "w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-500",
          className
        )}
        required={required}
        {...props}
      >
        {children}
      </select>
    </label>
  );
}
