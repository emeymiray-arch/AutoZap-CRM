import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PageHeader, Card, formatDateTime } from "@/components/layout/Page";
import { LEAD_FUNNEL_STAGES, LEAD_STATUS_LABELS, ACTIVITY_TYPE_LABELS } from "@/lib/labels";
import { startOfDay, endOfDay } from "date-fns";

async function kpi(href: string, label: string, value: number, tone?: string) {
  return (
    <Link
      href={href}
      className="rounded-lg border border-slate-200 bg-white p-4 transition hover:border-slate-400 hover:shadow-sm"
    >
      <div className="text-2xl font-semibold tabular-nums text-slate-900">{value}</div>
      <div className={`mt-1 text-xs ${tone || "text-slate-500"}`}>{label}</div>
    </Link>
  );
}

export default async function DashboardPage() {
  await auth();
  const todayStart = startOfDay(new Date());
  const todayEnd = endOfDay(new Date());

  const [
    newLeads,
    callsToday,
    contacted,
    proposalSent,
    agreed,
    registrations,
    waitingCatalog,
    catalogsReceived,
    storesProcessing,
    storesPublished,
    activePartners,
    overdueTasks,
    partnersContactToday,
    catalogsReady,
    storesReadyPublish,
    funnelCounts,
    activities,
  ] = await Promise.all([
    prisma.lead.count({ where: { archivedAt: null, status: "NEW" } }),
    prisma.activity.count({
      where: { type: "CALL", createdAt: { gte: todayStart, lte: todayEnd } },
    }),
    prisma.lead.count({ where: { archivedAt: null, status: "CONTACTED" } }),
    prisma.lead.count({ where: { archivedAt: null, status: "PROPOSAL_SENT" } }),
    prisma.lead.count({ where: { archivedAt: null, status: "AGREED" } }),
    prisma.lead.count({ where: { archivedAt: null, status: "REGISTRATION" } }),
    prisma.partner.count({ where: { archivedAt: null, status: "WAITING_CATALOG" } }),
    prisma.catalog.count({ where: { archivedAt: null, status: "RECEIVED" } }),
    prisma.store.count({
      where: { archivedAt: null, status: { in: ["CREATING", "SETUP", "CATALOG_LOADING", "REVIEW"] } },
    }),
    prisma.store.count({ where: { archivedAt: null, status: "PUBLISHED" } }),
    prisma.partner.count({ where: { archivedAt: null, status: "ACTIVE" } }),
    prisma.task.count({
      where: {
        archivedAt: null,
        OR: [
          { status: "OVERDUE" },
          { deadline: { lt: new Date() }, status: { in: ["NEW", "IN_PROGRESS", "REVIEW"] } },
        ],
      },
    }),
    prisma.partner.count({
      where: {
        archivedAt: null,
        nextContactAt: { gte: todayStart, lte: todayEnd },
      },
    }),
    prisma.catalog.count({ where: { archivedAt: null, status: { in: ["READY", "RECEIVED", "REVIEW"] } } }),
    prisma.store.count({ where: { archivedAt: null, status: "READY" } }),
    Promise.all(
      LEAD_FUNNEL_STAGES.map(async (s) => ({
        status: s,
        count: await prisma.lead.count({ where: { archivedAt: null, status: s } }),
      }))
    ),
    prisma.activity.findMany({
      include: { author: true },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);

  const funnelTotal = funnelCounts.reduce((a, b) => a + b.count, 0) || 1;

  return (
    <div>
      <PageHeader title="Дашборд" description="Состояние компании в реальном времени" />

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {await kpi("/crm/leads?status=NEW", "Новые лиды", newLeads)}
        {await kpi("/activities?type=CALL&today=1", "Звонки сегодня", callsToday)}
        {await kpi("/crm/leads?status=CONTACTED", "Контакт установлен", contacted)}
        {await kpi("/crm/leads?status=PROPOSAL_SENT", "КП отправлено", proposalSent)}
        {await kpi("/crm/leads?status=AGREED", "Согласились", agreed)}
        {await kpi("/crm/leads?status=REGISTRATION", "Регистрации", registrations)}
        {await kpi("/partners?status=WAITING_CATALOG", "Каталоги ожидаются", waitingCatalog)}
        {await kpi("/catalogs?status=RECEIVED", "Каталоги получены", catalogsReceived)}
        {await kpi("/stores?filter=processing", "Магазины в обработке", storesProcessing)}
        {await kpi("/stores?status=PUBLISHED", "Опубликованные магазины", storesPublished)}
        {await kpi("/partners?status=ACTIVE", "Активные партнёры", activePartners)}
      </div>

      <div className="mb-6 grid gap-4 lg:grid-cols-3">
        <Card title="Воронка лидов" className="lg:col-span-2">
          <div className="space-y-2">
            {funnelCounts.map((s, i) => {
              const prev = i === 0 ? s.count : funnelCounts[i - 1].count || 1;
              const conv = i === 0 ? 100 : Math.round((s.count / prev) * 100);
              return (
                <Link
                  key={s.status}
                  href={`/crm/leads?status=${s.status}`}
                  className="flex items-center gap-3 rounded-md px-2 py-1.5 hover:bg-slate-50"
                >
                  <div className="w-36 shrink-0 text-sm text-slate-700">
                    {LEAD_STATUS_LABELS[s.status]}
                  </div>
                  <div className="h-2 flex-1 overflow-hidden rounded bg-slate-100">
                    <div
                      className="h-full rounded bg-teal-700"
                      style={{ width: `${Math.min(100, (s.count / funnelTotal) * 100)}%` }}
                    />
                  </div>
                  <div className="w-16 text-right text-sm font-medium tabular-nums">{s.count}</div>
                  <div className="w-14 text-right text-xs text-slate-500">{conv}%</div>
                </Link>
              );
            })}
          </div>
        </Card>

        <Card title="Операционный блок">
          <ul className="space-y-2 text-sm">
            <li className="flex justify-between">
              <Link href="/partners?status=WAITING_CATALOG" className="hover:underline">
                Ждут каталог
              </Link>
              <span className="font-semibold">{waitingCatalog}</span>
            </li>
            <li className="flex justify-between">
              <Link href="/catalogs?filter=pending" className="hover:underline">
                Каталоги к обработке
              </Link>
              <span className="font-semibold">{catalogsReady}</span>
            </li>
            <li className="flex justify-between">
              <Link href="/stores?filter=processing" className="hover:underline">
                Магазины в обработке
              </Link>
              <span className="font-semibold">{storesProcessing}</span>
            </li>
            <li className="flex justify-between">
              <Link href="/stores?status=READY" className="hover:underline">
                Готовы к публикации
              </Link>
              <span className="font-semibold">{storesReadyPublish}</span>
            </li>
            <li className="flex justify-between text-rose-700">
              <Link href="/tasks?deadline=overdue" className="hover:underline">
                Просроченные задачи
              </Link>
              <span className="font-semibold">{overdueTasks}</span>
            </li>
            <li className="flex justify-between">
              <Link href="/partners?filter=contact_today" className="hover:underline">
                Контакт сегодня
              </Link>
              <span className="font-semibold">{partnersContactToday}</span>
            </li>
          </ul>
        </Card>
      </div>

      <Card title="Лента активности">
        <ul className="divide-y divide-slate-100">
          {activities.map((a) => (
            <li key={a.id} className="flex items-start justify-between gap-3 py-2.5 text-sm">
              <div>
                <span className="font-medium">{a.author?.name || "Система"}</span>
                <span className="text-slate-500">
                  {" "}
                  · {ACTIVITY_TYPE_LABELS[a.type] || a.type}
                </span>
                {a.comment && <div className="text-slate-700">{a.comment}</div>}
              </div>
              <div className="shrink-0 text-xs text-slate-400">{formatDateTime(a.createdAt)}</div>
            </li>
          ))}
          {activities.length === 0 && (
            <li className="py-6 text-center text-slate-500">Пока нет событий</li>
          )}
        </ul>
      </Card>
    </div>
  );
}
