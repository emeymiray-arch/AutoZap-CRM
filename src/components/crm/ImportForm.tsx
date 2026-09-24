"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Form";
import { Card } from "@/components/layout/Page";

type Preview = {
  total?: number;
  newCount?: number;
  dupeCount?: number;
  errorCount?: number;
  errors?: string[];
  [key: string]: unknown;
};

export function ImportForm({ entity }: { entity: string }) {
  const [preview, setPreview] = useState<Preview | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const listHref =
    entity === "leads" || entity === "companies" || entity === "contacts" || entity === "deals"
      ? `/crm/${entity}`
      : `/${entity}`;

  async function run(mode: "preview" | "commit") {
    if (!file) return;
    setPending(true);
    setError(null);
    if (mode === "preview") setResult(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(
        `/api/v1/import?entity=${encodeURIComponent(entity)}&mode=${mode}`,
        { method: "POST", body: fd }
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Ошибка");
        if (mode === "preview") setPreview(null);
        return;
      }
      if (mode === "preview") {
        setPreview(data);
      } else {
        setResult(
          `Импорт завершён: создано ${data.created ?? 0}, пропущено дублей ${data.skippedDupes ?? 0}`
        );
        setPreview(null);
      }
    } catch {
      setError("Сеть недоступна");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-4">
      <Card title="Файл">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void run("preview");
          }}
          className="space-y-3"
        >
          <Input
            name="file"
            label="CSV / XLSX"
            type="file"
            accept=".csv,.xlsx,.xls"
            required
            onChange={(e) => {
              setFile(e.target.files?.[0] || null);
              setPreview(null);
              setResult(null);
            }}
          />
          <Button type="submit" size="sm" disabled={pending || !file}>
            {pending ? "Обработка…" : "Предпросмотр"}
          </Button>
        </form>
      </Card>

      {error && (
        <Card>
          <p className="text-sm text-rose-700">{error}</p>
        </Card>
      )}

      {result && (
        <Card>
          <p className="text-sm text-emerald-800">{result}</p>
          <Button href={listHref} size="sm" className="mt-2">
            К списку
          </Button>
        </Card>
      )}

      {preview && (
        <Card title="Предпросмотр">
          <dl className="mb-3 grid gap-2 sm:grid-cols-4 text-sm">
            <div>
              <dt className="text-xs text-slate-500">Всего</dt>
              <dd className="font-semibold">{preview.total ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Новые</dt>
              <dd className="font-semibold text-emerald-700">{preview.newCount ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Дубли</dt>
              <dd className="font-semibold text-amber-700">{preview.dupeCount ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Ошибки</dt>
              <dd className="font-semibold text-rose-700">{preview.errorCount ?? "—"}</dd>
            </div>
          </dl>
          {preview.errors && preview.errors.length > 0 && (
            <ul className="mb-3 list-disc pl-5 text-sm text-rose-700">
              {(preview.errors as string[]).slice(0, 20).map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
          )}
          <Button
            type="button"
            size="sm"
            disabled={pending || !(preview.newCount && preview.newCount > 0)}
            onClick={() => void run("commit")}
          >
            {pending ? "Импорт…" : "Импортировать (только новые)"}
          </Button>
        </Card>
      )}
    </div>
  );
}
