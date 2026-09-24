import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PageHeader, Card, formatDateTime } from "@/components/layout/Page";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ListFilters } from "@/components/crm/ListFilters";
import { ACTIVITY_TYPE_LABELS } from "@/lib/labels";
import { parseListParams, dateRange, usersForSelect } from "@/lib/list-query";
import { createActivityAction } from "@/lib/actions";
import { Select, Textarea } from "@/components/ui/Form";
import type { Prisma } from "@prisma/client";
import { startOfDay, endOfDay } from "date-fns";

export default async function ActivitiesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await auth();
  if (!session?.user) return null;
  const raw = await searchParams;
  const sp = parseListParams(raw);
  const typeParam = Array.isArray(raw.type) ? raw.type[0] : raw.type;
  const type = typeParam || sp.status || "";
  const today = Array.isArray(raw.today) ? raw.today[0] : raw.today;
  const users = await usersForSelect();

  const where: Prisma.ActivityWhereInput = {
    ...(type ? { type: type as never } : {}),
    ...(sp.q ? { OR: [{ comment: { contains: sp.q, mode: "insensitive" as const } }] } : {}),
    ...(dateRange(sp.from, sp.to) ? { createdAt: dateRange(sp.from, sp.to) } : {}),
  };

  if (today === "1") {
    where.createdAt = { gte: startOfDay(new Date()), lte: endOfDay(new Date()) };
  }

  if (sp.responsibleId) {
    where.authorId = sp.responsibleId === "me" ? session.user.id : sp.responsibleId;
  }

  const activities = await prisma.activity.findMany({
    where,
    include: {
      author: true,
      company: true,
      lead: true,
      deal: true,
      partner: true,
      task: true,
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <div>
      <PageHeader title="Активности" description={`${activities.length} записей`} />
      <Suspense>
        <ListFilters
          entityType="activities"
          users={users}
          statusOptions={Object.entries(ACTIVITY_TYPE_LABELS)
            .filter(([k]) => ["CALL", "MESSAGE", "EMAIL", "MEETING", "COMMENT"].includes(k))
            .map(([value, label]) => ({ value, label }))}
        />
      </Suspense>
      <div className="mb-2 flex flex-wrap gap-2 text-xs">
        <Button href="/activities?type=CALL&today=1" variant="ghost" size="sm">
          Звонки сегодня
        </Button>
        <Button href="/activities?type=CALL" variant="ghost" size="sm">
          Все звонки
        </Button>
      </div>

      <div className="mb-4">
        <Card title="Добавить активность">
          <form action={createActivityAction} className="grid gap-3 md:grid-cols-2">
            <input type="hidden" name="redirectTo" value="/activities" />
            <Select name="type" label="Тип" defaultValue="COMMENT">
              {Object.entries(ACTIVITY_TYPE_LABELS)
                .filter(([k]) =>
                  ["CALL", "MESSAGE", "EMAIL", "MEETING", "COMMENT"].includes(k)
                )
                .map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
            </Select>
            <Textarea name="comment" label="Комментарий" required className="md:col-span-2" />
            <div>
              <Button type="submit" size="sm">
                Добавить
              </Button>
            </div>
          </form>
        </Card>
      </div>

      <Card>
        <ul className="divide-y divide-slate-100">
          {activities.map((a) => {
            const link =
              (a.leadId && `/crm/leads/${a.leadId}`) ||
              (a.dealId && `/crm/deals/${a.dealId}`) ||
              (a.partnerId && `/partners/${a.partnerId}`) ||
              (a.companyId && `/crm/companies/${a.companyId}`) ||
              (a.taskId && `/tasks/${a.taskId}`) ||
              null;
            return (
              <li key={a.id} className="flex items-start justify-between gap-3 py-3 text-sm">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge status={a.type}>{ACTIVITY_TYPE_LABELS[a.type] || a.type}</Badge>
                    <span className="font-medium">{a.author?.name || "Система"}</span>
                    {a.lead && <span className="text-slate-500">· {a.lead.title}</span>}
                    {a.partner && <span className="text-slate-500">· {a.partner.name}</span>}
                    {a.company && !a.lead && !a.partner && (
                      <span className="text-slate-500">· {a.company.name}</span>
                    )}
                  </div>
                  {a.comment && <div className="mt-1 text-slate-800">{a.comment}</div>}
                  {link && (
                    <Button href={link} variant="ghost" size="sm" className="mt-1">
                      Открыть карточку
                    </Button>
                  )}
                </div>
                <div className="shrink-0 text-xs text-slate-400">{formatDateTime(a.createdAt)}</div>
              </li>
            );
          })}
          {activities.length === 0 && (
            <li className="py-8 text-center text-slate-500">Пока нет активностей</li>
          )}
        </ul>
      </Card>
    </div>
  );
}
