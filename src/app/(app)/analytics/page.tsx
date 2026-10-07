import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PageHeader, Card } from "@/components/layout/Page";
import { canSeeAnalytics } from "@/lib/permissions";
import {
  PARTNER_FUNNEL_ORDER,
  PARTNER_STATUS_LABELS,
  PERSON_FUNNEL_ORDER,
  PERSON_STATUS_LABELS,
  STORE_FUNNEL_ORDER,
  STORE_STATUS_LABELS,
} from "@/lib/labels";

function FunnelBlock({
  title,
  stages,
  labels,
}: {
  title: string;
  stages: { status: string; count: number }[];
  labels: Record<string, string>;
}) {
  const max = Math.max(1, ...stages.map((s) => s.count));
  return (
    <Card title={title} className="!p-3">
      <ul className="space-y-1">
        {stages.map((s) => (
          <li key={s.status} className="flex items-center gap-2 text-xs">
            <span className="w-[7.5rem] shrink-0 truncate text-slate-600">{labels[s.status] || s.status}</span>
            <div className="min-w-0 flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-teal-500/80"
                style={{ width: `${(s.count / max) * 100}%` }}
              />
            </div>
            <span className="w-6 shrink-0 text-right font-semibold tabular-nums text-slate-800">{s.count}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

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

  const [partnerTotal, storeTotal, peopleTotal, taskOpen, partnerStages, storeStages, peopleStages] =
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
      Promise.all(
        PERSON_FUNNEL_ORDER.map(async (s) => ({
          status: s,
          count: await prisma.person.count({ where: { archivedAt: null, status: s } }),
        })),
      ),
    ]);

  const totals = [
    ["Партнёры", partnerTotal],
    ["Магазины", storeTotal],
    ["Частники", peopleTotal],
    ["Задачи", taskOpen],
  ] as const;

  return (
    <div>
      <PageHeader title="Аналитика" description="Партнёры, магазины и частники" />
      <div className="mb-4 flex flex-wrap gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm">
        {totals.map(([label, value]) => (
          <span key={label} className="text-slate-700">
            <span className="font-semibold tabular-nums">{value}</span>{" "}
            <span className="text-slate-500">{label}</span>
          </span>
        ))}
      </div>
      <div className="grid gap-3 lg:grid-cols-3">
        <FunnelBlock title="Партнёры" stages={partnerStages} labels={PARTNER_STATUS_LABELS} />
        <FunnelBlock title="Магазины" stages={storeStages} labels={STORE_STATUS_LABELS} />
        <FunnelBlock title="Частники" stages={peopleStages} labels={PERSON_STATUS_LABELS} />
      </div>
    </div>
  );
}
