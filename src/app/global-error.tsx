"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="ru">
      <body style={{ fontFamily: "system-ui, sans-serif", padding: 40, textAlign: "center" }}>
        <h1 style={{ fontSize: 20 }}>Сбой приложения</h1>
        <p style={{ color: "#64748b", marginTop: 8 }}>
          Обновите страницу. Если ошибка повторяется — сообщите администратору.
        </p>
        {error.digest && (
          <p style={{ color: "#94a3b8", fontSize: 12, marginTop: 8 }}>Код: {error.digest}</p>
        )}
        <button
          type="button"
          onClick={reset}
          style={{
            marginTop: 16,
            padding: "8px 16px",
            borderRadius: 6,
            background: "#0f172a",
            color: "#fff",
            border: 0,
            cursor: "pointer",
          }}
        >
          Обновить
        </button>
      </body>
    </html>
  );
}
