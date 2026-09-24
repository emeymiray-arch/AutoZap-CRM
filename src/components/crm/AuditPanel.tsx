import { prisma } from "@/lib/db";
import { formatDateTime } from "@/components/layout/Page";

export async function AuditPanel({ entityType, entityId }: { entityType: string; entityId: string }) {
  const logs = await prisma.auditLog.findMany({
    where: { entityType, entityId },
    include: { user: true },
    orderBy: { createdAt: "desc" },
    take: 40,
  });

  const status = await prisma.statusHistory.findMany({
    where: { entityType, entityId },
    include: { user: true },
    orderBy: { createdAt: "desc" },
    take: 40,
  });

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div>
        <h3 className="mb-2 text-sm font-semibold">История изменений</h3>
        <ul className="space-y-2">
          {logs.map((l) => (
            <li key={l.id} className="rounded border border-slate-200 bg-white px-3 py-2 text-sm">
              <div className="text-xs text-slate-500">
                {l.user?.name || "Система"} · {formatDateTime(l.createdAt)}
              </div>
              <div>{l.summary || l.action}</div>
            </li>
          ))}
          {logs.length === 0 && <li className="text-sm text-slate-500">Нет записей</li>}
        </ul>
      </div>
      <div>
        <h3 className="mb-2 text-sm font-semibold">История статусов</h3>
        <ul className="space-y-2">
          {status.map((s) => (
            <li key={s.id} className="rounded border border-slate-200 bg-white px-3 py-2 text-sm">
              <div className="text-xs text-slate-500">
                {s.user?.name || "Система"} · {formatDateTime(s.createdAt)}
              </div>
              <div>
                {s.oldValue || "—"} → {s.newValue || "—"}
              </div>
            </li>
          ))}
          {status.length === 0 && <li className="text-sm text-slate-500">Нет смен статуса</li>}
        </ul>
      </div>
    </div>
  );
}
