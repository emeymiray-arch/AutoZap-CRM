import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PageHeader, Card } from "@/components/layout/Page";

async function kpi(href: string, label: string, value: number) {
  return (
    <Link
      href={href}
      className="rounded-2xl border border-slate-200 bg-white p-4 transition hover:-translate-y-0.5 hover:border-teal-300 hover:shadow-md"
    >
      <div className="text-2xl font-semibold tabular-nums text-slate-900">{value}</div>
      <div className="mt-1 text-xs text-slate-500">{label}</div>
    </Link>
  );
}

export default async function DashboardPage() {
  await auth();

  const [partners, stores, people, myOpenTasks, overdueTasks] = await Promise.all([
    prisma.partner.count({ where: { archivedAt: null } }),
    prisma.store.count({ where: { archivedAt: null } }),
    prisma.person.count({ where: { archivedAt: null } }),
    prisma.task.count({
      where: { archivedAt: null, status: { in: ["NEW", "IN_PROGRESS", "REVIEW"] } },
    }),
    prisma.task.count({
      where: {
        archivedAt: null,
        OR: [
          { status: "OVERDUE" },
          { deadline: { lt: new Date() }, status: { in: ["NEW", "IN_PROGRESS", "REVIEW"] } },
        ],
      },
    }),
  ]);

  return (
    <div>
      <PageHeader title="Дашборд" description="Партнёры, магазины, частники и задачи" />

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        {await kpi("/partners", "Партнёры", partners)}
        {await kpi("/stores", "Магазины", stores)}
        {await kpi("/people", "Частники", people)}
        {await kpi("/tasks", "Задачи в работе", myOpenTasks)}
        {await kpi("/tasks?deadline=overdue", "Просрочено", overdueTasks)}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Card title="Быстрые действия">
          <div className="flex flex-col gap-2 text-sm">
            <Link href="/partners/new" className="rounded-lg bg-slate-50 px-3 py-2 hover:bg-teal-50">
              + Партнёр
            </Link>
            <Link href="/stores/new" className="rounded-lg bg-slate-50 px-3 py-2 hover:bg-teal-50">
              + Магазин
            </Link>
            <Link href="/people/new" className="rounded-lg bg-slate-50 px-3 py-2 hover:bg-teal-50">
              + Частник
            </Link>
            <Link href="/tasks/new" className="rounded-lg bg-slate-50 px-3 py-2 hover:bg-teal-50">
              + Задача
            </Link>
          </div>
        </Card>
        <Card title="Подсказка">
          <p className="text-sm text-slate-600">
            У партнёра укажите название, телефон, город, магазины, склады и производство отдельными
            полями. Комментарий — только для заметок. Задачу себе ставит любой сотрудник; коллеге
            или всей команде — руководитель или администратор.
          </p>
        </Card>
      </div>
    </div>
  );
}
