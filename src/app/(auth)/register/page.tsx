"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Form";
import { registerAction } from "@/lib/actions";
import { SELECTABLE_ROLES } from "@/lib/permissions";

function RegisterForm() {
  const params = useSearchParams();
  const error = params.get("error");
  const [role, setRole] = useState("MANAGER");
  const hint = SELECTABLE_ROLES.find((r) => r.value === role)?.hint;

  return (
    <form action={registerAction} className="space-y-4">
      <Input name="name" label="Имя" required autoComplete="name" placeholder="Как вас зовут" />
      <Input name="email" label="Email" type="email" required autoComplete="email" />
      <Input
        name="password"
        label="Пароль"
        type="password"
        required
        minLength={6}
        autoComplete="new-password"
      />
      <Select
        name="role"
        label="Роль"
        required
        value={role}
        onChange={(e) => setRole(e.target.value)}
      >
        {SELECTABLE_ROLES.map((r) => (
          <option key={r.value} value={r.value}>
            {r.label}
          </option>
        ))}
      </Select>
      {hint && <p className="text-xs text-slate-500">{hint}</p>}
      {error && <div className="text-sm text-rose-600">{error}</div>}
      <Button type="submit" className="w-full">
        Зарегистрироваться
      </Button>
      <p className="text-center text-sm text-slate-500">
        Уже есть аккаунт?{" "}
        <Link href="/login" className="font-medium text-slate-900 underline">
          Войти
        </Link>
      </p>
    </form>
  );
}

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
      <div className="w-full max-w-md rounded-xl border border-slate-800 bg-white p-8 shadow-2xl">
        <div className="mb-6 text-center">
          <div className="text-2xl font-semibold tracking-tight">AutoZap OS</div>
          <p className="mt-1 text-sm text-slate-500">Регистрация участника</p>
        </div>
        <Suspense>
          <RegisterForm />
        </Suspense>
      </div>
    </div>
  );
}
