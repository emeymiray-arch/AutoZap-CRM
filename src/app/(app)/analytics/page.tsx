import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PageHeader, Card } from "@/components/layout/Page";
import { canSeeAnalytics } from "@/lib/permissions";
import { PARTNER_FUNNEL_ORDER, PARTNER_STATUS_LABELS, STORE_FUNNEL_ORDER, STORE_STATUS_LABELS } from "@/lib/labels";

export default async function AnalyticsPage() {
  const session = await auth();
  if (!session?.user) return null;

  if (!canSeeAnalytics(session.user.role)) {
    return (
      <div>
        <PageHeader title="Аналитика" />
        <Card>
          <p className="text-sm text-slate-600">Аналитика доступна руководителям и администраторам.</p>
        </Card>
      </div>
    );
  }

  const [partnerTotal, storeTotal, peopleTotal, taskOpen, partnerStages, storeStages] =
    await Promise.all([
      prisma.partner.count({ where: { archivedAt: null } }),
      prisma.store.count({ where: { archivedAt: null } }),
      prisma.person.count({ where: { archivedAt: null } }),
      prisma.task.count({
        where: { archivedAt: null, status: { in: ["NEW", "IN_PROGRESS", "REVIEW", "OVERDUE"] } },
      }),
      Promise.all(
        PARTNER_FUNNEL_ORDER.map(async (s) => ({
          status: s,
          count: await prisma.partner.count({ where: { archivedAt: null, status: s } }),
        })),
      ),
      Promise.all(
        STORE_FUNNEL_ORDER.map(async (s) => ({
          status: s,
          count: await prisma.store.count({ where: { archivedAt: null, status: s } }),
        })),
      ),
    ]);

  return (
    <div>
      <PageHeader title="Аналитика" description="Сводка по базе" />
      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          ["Партнёры", partnerTotal],
          ["Магазины", storeTotal],
          ["Частники", peopleTotal],
          ["Открытые задачи", taskOpen],
        ].map(([label, value]) => (
          <Card key={String(label)}>
            <div className="text-2xl font-semibold tabular-nums">{value as number}</div>
            <div className="text-xs text-slate-500">{label}</div>
          </Card>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Воронка партнёров">
          <ul className="space-y-2 text-sm">
            {partnerStages.map((s) => (
              <li key={s.status} className="flex justify-between">
                <span>{PARTNER_STATUS_LABELS[s.status]}</span>
                <span className="font-semibold tabular-nums">{s.count}</span>
              </li>
            ))}
          </ul>
        </Card>
        <Card title="Воронка магазинов">
          <ul className="space-y-2 text-sm">
            {storeStages.map((s) => (
              <li key={s.status} className="flex justify-between">
                <span>{STORE_STATUS_LABELS[s.status]}</span>
                <span className="font-semibold tabular-nums">{s.count}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
