import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PageHeader, Card } from "@/components/layout/Page";
import { Button } from "@/components/ui/Button";
import { canSeeAnalytics } from "@/lib/permissions";
import {
  startOfDay,
  endOfDay,
  startOfWeek,
  startOfMonth,
  startOfQuarter,
  format,
  eachDayOfInterval,
} from "date-fns";
import { ru } from "date-fns/locale";

function periodRange(
  period: string,
  from?: string,
  to?: string
): { start: Date; end: Date } {
  const now = new Date();
  const end = endOfDay(now);
  switch (period) {
    case "today":
      return { start: startOfDay(now), end };
    case "week":
      return { start: startOfWeek(now, { weekStartsOn: 1 }), end };
    case "month":
      return { start: startOfMonth(now), end };
    case "quarter":
      return { start: startOfQuarter(now), end };
    case "custom":
      return {
        start: from ? startOfDay(new Date(from)) : startOfMonth(now),
        end: to ? endOfDay(new Date(to)) : end,
      };
    default:
      return { start: startOfMonth(now), end };
  }
}

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await auth();
  if (!session?.user) return null;

  if (!canSeeAnalytics(session.user.role)) {
    return (
      <div>
        <PageHeader title="Аналитика" />
        <Card>
          <p className="text-sm text-slate-600">
            Аналитика доступна руководителям и администраторам.
          </p>
        </Card>
      </div>
    );
  }

  const raw = await searchParams;
  const g = (k: string) => {
    const v = raw[k];
    return Array.isArray(v) ? v[0] : v;
  };
  const period = g("period") || "month";
  const { start, end } = periodRange(period, g("from"), g("to"));

  const leadsInPeriod = await prisma.lead.findMany({
    where: { archivedAt: null, createdAt: { gte: start, lte: end } },
    include: { responsible: true },
  });

  const days = eachDayOfInterval({ start, end });
  const byDay = days.map((d) => {
    const key = format(d, "yyyy-MM-dd");
    const count = leadsInPeriod.filter(
      (l) => format(l.createdAt, "yyyy-MM-dd") === key
    ).length;
    return { day: key, label: format(d, "dd.MM", { locale: ru }), count };
  });

  const byManagerMap = new Map<string, { name: string; count: number }>();
  for (const l of leadsInPeriod) {
    const id = l.responsibleId || "none";
    const name = l.responsible?.name || "Без ответственного";
    const cur = byManagerMap.get(id) || { name, count: 0 };
    cur.count++;
    byManagerMap.set(id, cur);
  }
  const byManager = [...byManagerMap.values()].sort((a, b) => b.count - a.count);

  const converted = await prisma.lead.count({
    where: {
      archivedAt: null,
      status: "CONVERTED",
      updatedAt: { gte: start, lte: end },
    },
  });
  const wonDeals = await prisma.deal.count({
    where: {
      archivedAt: null,
      stage: "WON",
      updatedAt: { gte: start, lte: end },
    },
  });
  const calls = await prisma.activity.count({
    where: { type: "CALL", createdAt: { gte: start, lte: end } },
  });
  const overdueTasks = await prisma.task.count({
    where: {
      archivedAt: null,
      OR: [
        { status: "OVERDUE" },
        {
          deadline: { lt: new Date() },
          status: { in: ["NEW", "IN_PROGRESS", "REVIEW"] },
        },
      ],
    },
  });
  const publishedStores = await prisma.store.count({
    where: {
      archivedAt: null,
      status: { in: ["PUBLISHED", "ACTIVE"] },
      OR: [
        { publishedAt: { gte: start, lte: end } },
        { status: "PUBLISHED", updatedAt: { gte: start, lte: end } },
      ],
    },
  });

  const periods = [
    { id: "today", label: "Сегодня" },
    { id: "week", label: "Неделя" },
    { id: "month", label: "Месяц" },
    { id: "quarter", label: "Квартал" },
    { id: "custom", label: "Период" },
  ];

  return (
    <div>
      <PageHeader
        title="Аналитика"
        description={`${format(start, "dd.MM.yyyy")} — ${format(end, "dd.MM.yyyy")}`}
      />

      <div className="mb-4 flex flex-wrap gap-2">
        {periods.map((p) => (
          <Button
            key={p.id}
            href={`/analytics?period=${p.id}`}
            variant={period === p.id ? "primary" : "secondary"}
            size="sm"
          >
            {p.label}
          </Button>
        ))}
      </div>

      {period === "custom" && (
        <Card className="mb-4">
          <form className="flex flex-wrap items-end gap-2">
            <input type="hidden" name="period" value="custom" />
            <label className="block space-y-1 text-sm">
              <span className="text-xs text-slate-600">С</span>
              <input
                type="date"
                name="from"
                defaultValue={g("from") || ""}
                className="block rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
            </label>
            <label className="block space-y-1 text-sm">
              <span className="text-xs text-slate-600">По</span>
              <input
                type="date"
                name="to"
                defaultValue={g("to") || ""}
                className="block rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
            </label>
            <Button type="submit" size="sm">
              Применить
            </Button>
          </form>
        </Card>
      )}

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        {[
          { label: "Лиды за период", value: leadsInPeriod.length, href: "/crm/leads" },
          { label: "Конверсии (лиды)", value: converted, href: "/crm/leads?status=CONVERTED" },
          { label: "Сделки WON", value: wonDeals, href: "/crm/deals?stage=WON" },
          { label: "Звонки", value: calls, href: "/activities?type=CALL" },
          { label: "Просроченные задачи", value: overdueTasks, href: "/tasks?deadline=overdue" },
          { label: "Опубликованные магазины", value: publishedStores, href: "/stores?status=PUBLISHED" },
        ].map((k) => (
          <Link
            key={k.label}
            href={k.href}
            className="rounded-lg border border-slate-200 bg-white p-4 transition hover:border-slate-400"
          >
            <div className="text-2xl font-semibold tabular-nums">{k.value}</div>
            <div className="mt-1 text-xs text-slate-500">{k.label}</div>
          </Link>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Лиды по дням">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="text-left text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-2 py-1.5">День</th>
                  <th className="px-2 py-1.5 text-right">Лидов</th>
                </tr>
              </thead>
              <tbody>
                {byDay.map((d) => (
                  <tr key={d.day} className="border-t border-slate-100">
                    <td className="px-2 py-1.5">{d.label}</td>
                    <td className="px-2 py-1.5 text-right tabular-nums font-medium">{d.count}</td>
                  </tr>
                ))}
                {byDay.length === 0 && (
                  <tr>
                    <td colSpan={2} className="px-2 py-6 text-center text-slate-500">
                      Нет данных
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        <Card title="Лиды по менеджерам">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="text-left text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-2 py-1.5">Менеджер</th>
                  <th className="px-2 py-1.5 text-right">Лидов</th>
                </tr>
              </thead>
              <tbody>
                {byManager.map((m) => (
                  <tr key={m.name} className="border-t border-slate-100">
                    <td className="px-2 py-1.5">{m.name}</td>
                    <td className="px-2 py-1.5 text-right tabular-nums font-medium">{m.count}</td>
                  </tr>
                ))}
                {byManager.length === 0 && (
                  <tr>
                    <td colSpan={2} className="px-2 py-6 text-center text-slate-500">
                      Нет данных
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
