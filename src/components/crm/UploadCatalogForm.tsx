"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

export function UploadCatalogForm({ catalogId }: { catalogId: string }) {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setLoading(true);
    setError("");
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch(`/api/v1/catalogs/${catalogId}/upload`, { method: "POST", body: fd });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Ошибка загрузки");
      return;
    }
    setResult(data.validation || data);
    window.location.reload();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
      <input
        type="file"
        accept=".xlsx,.xls,.csv"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
        className="block w-full text-sm"
      />
      {error && <div className="text-sm text-rose-600">{error}</div>}
      {result && (
        <pre className="overflow-auto rounded bg-white p-2 text-xs">{JSON.stringify(result, null, 2)}</pre>
      )}
      <Button type="submit" size="sm" disabled={!file || loading}>
        {loading ? "Загрузка…" : "Загрузить Excel/CSV"}
      </Button>
    </form>
  );
}
