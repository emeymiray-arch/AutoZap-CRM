"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

export function PasswordInput({
  className,
  label = "Пароль",
  required,
  name = "password",
  ...props
}: Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> & { label?: string }) {
  const [show, setShow] = useState(false);

  return (
    <label className="block space-y-1">
      {label && (
        <span className="text-xs font-medium text-slate-600">
          {label}
          {required ? <span className="text-rose-600"> *</span> : null}
        </span>
      )}
      <div className="relative">
        <input
          name={name}
          type={show ? "text" : "password"}
          className={cn(
            "w-full rounded-md border border-slate-300 bg-white px-3 py-2 pr-10 text-sm outline-none focus:border-slate-500",
            className,
          )}
          required={required}
          {...props}
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
          title={show ? "Скрыть пароль" : "Показать пароль"}
          aria-label={show ? "Скрыть пароль" : "Показать пароль"}
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </label>
  );
}
