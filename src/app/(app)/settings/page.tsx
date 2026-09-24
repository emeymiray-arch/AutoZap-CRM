import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PageHeader, Card, formatDateTime } from "@/components/layout/Page";
import { ROLE_LABELS } from "@/lib/labels";
import { Badge } from "@/components/ui/Badge";
import { BITRIX24_INTEGRATION_TODO } from "@/lib/integrations/bitrix24/mapper";
import { canManageUsers } from "@/lib/permissions";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user) return null;

  const users = await prisma.user.findMany({
    where: { archivedAt: null },
    orderBy: { name: "asc" },
  });

  const audit = await prisma.auditLog.findMany({
    include: { user: true },
    orderBy: { createdAt: "desc" },
    take: 30,
  });

  return (
    <div>
      <PageHeader title="Настройки" description="Пользователи, роли, аудит, интеграции" />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Пользователи и роли">
          {!canManageUsers(session.user.role) && (
            <p className="mb-3 text-xs text-amber-700">
              Управление пользователями доступно администратору. Вы видите список только для чтения.
            </p>
          )}
          <ul className="space-y-2 text-sm">
            {users.map((u) => (
              <li key={u.id} className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2">
                <div>
                  <div className="font-medium">{u.name}</div>
                  <div className="text-xs text-slate-500">{u.email}</div>
                </div>
                <Badge>{ROLE_LABELS[u.role] || u.role}</Badge>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-slate-500">
            TODO: UI создания доп. ролей и приглашения пользователей (расширение этапа 1).
          </p>
        </Card>

        <Card title="Интеграция Bitrix24">
          <p className="text-sm text-slate-700">{BITRIX24_INTEGRATION_TODO}</p>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-600">
            <li>Экспорт CSV/XLSX с UF_AUTOZAP_ID уже доступен</li>
            <li>Таблица ExternalIdMap готова к сопоставлению ID</li>
            <li>REST-клиент — отдельный модуль этапа 6</li>
          </ul>
        </Card>
      </div>

      <div className="mt-4">
        <Card title="Журнал аудита (последние события)">
          <ul className="divide-y divide-slate-100 text-sm">
            {audit.map((a) => (
              <li key={a.id} className="py-2">
                <div className="text-xs text-slate-500">
                  {a.user?.name || "Система"} · {formatDateTime(a.createdAt)} · {a.entityType} ·{" "}
                  {a.entityId.slice(0, 8)}…
                </div>
                <div>{a.summary || a.action}</div>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
