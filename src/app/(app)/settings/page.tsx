import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PageHeader, Card, formatDateTime } from "@/components/layout/Page";
import { BITRIX24_INTEGRATION_TODO } from "@/lib/integrations/bitrix24/mapper";
import { canAccessSettings, SELECTABLE_ROLES } from "@/lib/permissions";
import { createTeamUserAction } from "@/lib/actions";
import { Input, Select } from "@/components/ui/Form";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { Button } from "@/components/ui/Button";
import { StaffCredentialsList } from "@/components/settings/StaffCredentialsList";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ added?: string }>;
}) {
  const session = await auth();
  if (!session?.user) return null;
  if (!canAccessSettings(session.user.role)) redirect("/dashboard");

  const sp = await searchParams;

  const users = await prisma.user.findMany({
    where: { archivedAt: null },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      adminPassword: true,
    },
  });

  const audit = await prisma.auditLog.findMany({
    include: { user: true },
    orderBy: { createdAt: "desc" },
    take: 30,
  });

  return (
    <div>
      <PageHeader title="Настройки" description="Аккаунты и пароли сотрудников — только для вас" />

      {sp.added && (
        <div className="mb-4 rounded-md border border-teal-200 bg-teal-50 px-3 py-2 text-sm text-teal-800">
          Аккаунт создан. Логин и пароль сохранены в списке ниже — передайте их сотруднику.
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Логины и пароли участников">
          <p className="mb-3 text-xs text-slate-500">
            Видно только администратору программы. Менеджеры и руководители этот экран не открывают.
          </p>
          <StaffCredentialsList users={users} />

          <form action={createTeamUserAction} className="space-y-3 border-t border-slate-100 pt-4">
            <div className="text-sm font-medium text-slate-800">Создать аккаунт</div>
            <Input name="name" label="Имя" required placeholder="Имя сотрудника" />
            <Input name="email" label="Логин (email)" type="email" required />
            <PasswordInput name="password" label="Пароль" required minLength={6} autoComplete="new-password" />
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
        </Card>

        <Card title="Интеграция Bitrix24">
          <p className="text-sm text-slate-700">{BITRIX24_INTEGRATION_TODO}</p>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-600">
            <li>Экспорт CSV/XLSX с UF_AUTOZAP_ID — в списках CRM (у вас и у руководства)</li>
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
