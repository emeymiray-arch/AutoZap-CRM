import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PageHeader, Card, formatDateTime } from "@/components/layout/Page";
import { ROLE_LABELS } from "@/lib/labels";
import { Badge } from "@/components/ui/Badge";
import { BITRIX24_INTEGRATION_TODO } from "@/lib/integrations/bitrix24/mapper";
import { canManageUsers, SELECTABLE_ROLES } from "@/lib/permissions";
import { createTeamUserAction } from "@/lib/actions";
import { Input, Select } from "@/components/ui/Form";
import { Button } from "@/components/ui/Button";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ added?: string }>;
}) {
  const session = await auth();
  if (!session?.user) return null;
  const sp = await searchParams;
  const canAdd = canManageUsers(session.user.role);

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
      <PageHeader title="Настройки" description="Участники, роли, аудит, интеграции" />

      {sp.added && (
        <div className="mb-4 rounded-md border border-teal-200 bg-teal-50 px-3 py-2 text-sm text-teal-800">
          Участник добавлен — имя сразу доступно в поле «Ответственный» при создании записей.
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Участники и роли">
          {!canAdd && (
            <p className="mb-3 text-xs text-amber-700">
              Аккаунты создаёт только администратор программы.
            </p>
          )}
          <ul className="mb-4 space-y-2 text-sm">
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

          {canAdd && (
            <form action={createTeamUserAction} className="space-y-3 border-t border-slate-100 pt-4">
              <div className="text-sm font-medium text-slate-800">Создать аккаунт менеджеру / руководителю</div>
              <p className="text-xs text-slate-500">
                Имя обязательно — сразу появится в поле «Ответственный». Человек входит по email и паролю.
              </p>
              <Input name="name" label="Имя" required placeholder="Имя сотрудника" />
              <Input name="email" label="Email" type="email" required />
              <Input name="password" label="Пароль" type="password" required minLength={6} />
              <Select name="role" label="Роль" required defaultValue="MANAGER">
                {SELECTABLE_ROLES.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </Select>
              <Button type="submit" size="sm">
                Создать аккаунт
              </Button>
            </form>
          )}
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
