"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/Button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[app-error]", error);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 px-4 text-center">
      <h2 className="text-lg font-semibold text-slate-900">Что-то пошло не так</h2>
      <p className="max-w-md text-sm text-slate-500">
        Ошибка обработана. Можно попробовать снова — данные не должны пропасть.
      </p>
      {error.digest && (
        <p className="text-xs text-slate-400">Код: {error.digest}</p>
      )}
      <Button type="button" size="sm" onClick={reset}>
        Повторить
      </Button>
    </div>
  );
}
