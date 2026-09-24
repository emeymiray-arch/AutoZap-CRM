"use client";

import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Form";
import { PasswordInput } from "@/components/ui/PasswordInput";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
      if (res?.error) {
        setError(
          res.error === "Configuration"
            ? "Ошибка конфигурации входа на сервере. Попробуйте позже."
            : "Неверный email или пароль",
        );
        return;
      }
      if (!res?.ok) {
        setError("Не удалось войти. Проверьте email и пароль.");
        return;
      }
      router.push(params.get("callbackUrl") || "/dashboard");
      router.refresh();
    } catch {
      setError("Сервер входа недоступен. Обновите страницу и попробуйте снова.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Input
        label="Email"
        type="email"
        required
        autoComplete="username"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <PasswordInput
        name="password"
        label="Пароль"
        required
        autoComplete="current-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      {error && <div className="text-sm text-rose-600">{error}</div>}
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Вход…" : "Войти"}
      </Button>
      <p className="text-center text-xs text-slate-500">
        Аккаунт выдаёт администратор программы
      </p>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
      <div className="w-full max-w-md rounded-xl border border-slate-800 bg-white p-8 shadow-2xl">
        <div className="mb-6 text-center">
          <div className="text-2xl font-semibold tracking-tight">AutoZap OS</div>
          <p className="mt-1 text-sm text-slate-500">Вход в операционную систему</p>
        </div>
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
