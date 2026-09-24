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
  news?: number[];
  dupes?: number[];
  [key: string]: unknown;
};

export function ImportForm({ entity }: { entity: string }) {
  const [preview, setPreview] = useState<Preview | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function runPreview(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setPending(true);
    setError(null);
    setResult(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("mode", "preview");
      const res = await fetch(`/api/v1/import?entity=${encodeURIComponent(entity)}`, {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Ошибка предпросмотра");
        setPreview(null);
      } else {
        setPreview(data);
      }
    } catch {
      setError("Сеть недоступна");
    } finally {
      setPending(false);
    }
  }

  async function confirmImport() {
    if (!file) return;
    setPending(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("mode", "confirm");
      fd.append("onlyNew", "1");
      const res = await fetch(`/api/v1/import?entity=${encodeURIComponent(entity)}`, {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Ошибка импорта");
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
        <form onSubmit={runPreview} className="space-y-3">
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
          <Button href={`/crm/${entity}`} size="sm" className="mt-2">
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
          <pre className="max-h-64 overflow-auto rounded-md bg-slate-50 p-3 text-xs text-slate-800">
            {JSON.stringify(
              {
                new: preview.news,
                dupes: preview.dupes,
                errors: preview.errors,
                newCount: preview.newCount,
                dupeCount: preview.dupeCount,
                errorCount: preview.errorCount,
              },
              null,
              2
            )}
          </pre>
          <div className="mt-3">
            <Button type="button" size="sm" disabled={pending} onClick={confirmImport}>
              {pending ? "Импорт…" : "Подтвердить импорт (только новые)"}
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
