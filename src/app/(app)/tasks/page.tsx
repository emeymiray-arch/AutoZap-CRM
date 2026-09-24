import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PageHeader, formatDate, formatDateTime } from "@/components/layout/Page";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/ui/DataTable";
import { Badge } from "@/components/ui/Badge";
import { ListFilters } from "@/components/crm/ListFilters";
import { DataTools } from "@/components/crm/DataTools";
import { TASK_STATUS_LABELS, TASK_PRIORITY_LABELS } from "@/lib/labels";
import { parseListParams, scopeWhere, usersForSelect } from "@/lib/list-query";
import type { Prisma } from "@prisma/client";
import { startOfDay, endOfDay } from "date-fns";

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await auth();
  if (!session?.user) return null;
  const sp = parseListParams(await searchParams);
  const users = await usersForSelect();
  const savedFilters = await prisma.savedFilter.findMany({
    where: { userId: session.user.id, entityType: "tasks" },
  });

  let responsibleId = sp.responsibleId;
  if (responsibleId === "me") responsibleId = session.user.id;

  const where: Prisma.TaskWhereInput = {
    archivedAt: null,
    ...scopeWhere(session.user),
    ...(sp.status ? { status: sp.status as never } : {}),
    ...(responsibleId ? { responsibleId } : {}),
    ...(sp.q
      ? { OR: [{ title: { contains: sp.q, mode: "insensitive" as const } }, { description: { contains: sp.q, mode: "insensitive" as const } }] }
      : {}),
  };

  if (sp.deadline === "overdue") {
    const overdueCond: Prisma.TaskWhereInput = {
      OR: [
        { status: "OVERDUE" },
        {
          deadline: { lt: new Date() },
          status: { in: ["NEW", "IN_PROGRESS", "REVIEW"] },
        },
      ],
    };
    where.AND = [
      ...(Array.isArray(where.AND) ? where.AND : where.AND ? [where.AND] : []),
      overdueCond,
    ];
  } else if (sp.deadline === "today") {
    where.deadline = { gte: startOfDay(new Date()), lte: endOfDay(new Date()) };
  }

  const rows = await prisma.task.findMany({
    where,
    include: { responsible: true, company: true },
    orderBy: [{ deadline: "asc" }, { updatedAt: "desc" }],
    take: 200,
  });

  return (
    <div>
      <PageHeader
        title="Задачи"
        description={`${rows.length} записей`}
        actions={
          <>
            <DataTools entity="tasks" />
            <Button href="/tasks/new" size="sm">
              + Создать
            </Button>
          </>
        }
      />
      <Suspense>
        <ListFilters
          entityType="tasks"
          users={users}
          savedFilters={savedFilters}
          showDeadline
          statusOptions={Object.entries(TASK_STATUS_LABELS).map(([value, label]) => ({
            value,
            label,
          }))}
        />
      </Suspense>
      <div className="mb-2 flex flex-wrap gap-2 text-xs">
        <Button href="/tasks?responsibleId=me" variant="ghost" size="sm">
          Мои задачи
        </Button>
        <Button href="/tasks?deadline=overdue" variant="ghost" size="sm">
          Просроченные
        </Button>
        <Button href="/tasks?deadline=today" variant="ghost" size="sm">
          На сегодня
        </Button>
      </div>
      <DataTable
        rows={rows}
        href={(r) => `/tasks/${r.id}`}
        columns={[
          { key: "title", header: "Название", render: (r) => r.title },
          {
            key: "status",
            header: "Статус",
            render: (r) => {
              const overdue =
                r.status === "OVERDUE" ||
                (r.deadline &&
                  r.deadline < new Date() &&
                  ["NEW", "IN_PROGRESS", "REVIEW"].includes(r.status));
              return (
                <span className="inline-flex flex-wrap items-center gap-1">
                  <Badge status={r.status}>{TASK_STATUS_LABELS[r.status] || r.status}</Badge>
                  {overdue && <Badge status="OVERDUE">Просрочена</Badge>}
                </span>
              );
            },
          },
          {
            key: "priority",
            header: "Приоритет",
            render: (r) => TASK_PRIORITY_LABELS[r.priority] || r.priority,
          },
          { key: "resp", header: "Ответственный", render: (r) => r.responsible?.name || "—" },
          {
            key: "deadline",
            header: "Дедлайн",
            render: (r) => formatDateTime(r.deadline),
          },
          { key: "created", header: "Создана", render: (r) => formatDate(r.createdAt) },
        ]}
      />
    </div>
  );
}
