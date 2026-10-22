"use client";

import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import Image from "next/image";
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
            : res.error === "AccessDenied"
              ? "Слишком много попыток входа. Подождите 15 минут."
              : "Неверный логин или пароль",
        );
        return;
      }
      if (!res?.ok) {
        setError("Не удалось войти. Проверьте логин и пароль.");
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
        label="Логин"
        type="text"
        name="login"
        required
        autoComplete="username"
        inputMode="text"
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
    <div className="relative flex min-h-[100dvh] items-center justify-center overflow-hidden px-3 py-6 sm:px-4">
      <div className="absolute inset-0 az-brand-grad opacity-90" />
      <div className="absolute inset-0 bg-slate-950/55" />
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-white/20 bg-white p-5 shadow-2xl sm:p-8">
        <div className="mb-6 flex flex-col items-center text-center">
          <Image
            src="/brand/autozap-mark.png"
            alt="AutoZap"
            width={72}
            height={72}
            className="mb-3 rounded-full shadow-md"
            priority
          />
          <div className="text-2xl font-semibold tracking-tight text-slate-900">AutoZap OS</div>
          <p className="mt-1 text-sm text-slate-500">Вход в операционную систему</p>
        </div>
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
