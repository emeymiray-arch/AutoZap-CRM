import { prisma } from "@/lib/db";
import { ACTIVITY_TYPE_LABELS } from "@/lib/labels";
import { formatDateTime } from "@/components/layout/Page";
import { createActivityAction } from "@/lib/actions";
import { Button } from "@/components/ui/Button";
import { Select, Textarea } from "@/components/ui/Form";

export async function ActivityFeed({
  where,
  redirectTo,
  hiddenFields,
}: {
  where: Record<string, string | undefined | null>;
  redirectTo: string;
  hiddenFields?: Record<string, string | undefined | null>;
}) {
  const activities = await prisma.activity.findMany({
    where: {
      ...(where.companyId ? { companyId: where.companyId } : {}),
      ...(where.leadId ? { leadId: where.leadId } : {}),
      ...(where.dealId ? { dealId: where.dealId } : {}),
      ...(where.partnerId ? { partnerId: where.partnerId } : {}),
      ...(where.contactId ? { contactId: where.contactId } : {}),
      ...(where.catalogId ? { catalogId: where.catalogId } : {}),
      ...(where.storeId ? { storeId: where.storeId } : {}),
      ...(where.taskId ? { taskId: where.taskId } : {}),
    },
    include: { author: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div className="space-y-4">
      <form action={createActivityAction} className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
        <input type="hidden" name="redirectTo" value={redirectTo} />
        {Object.entries(hiddenFields || where).map(([k, v]) =>
          v ? <input key={k} type="hidden" name={k} value={v} /> : null
        )}
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
        <Textarea name="comment" label="Комментарий" required placeholder="Что произошло…" />
        <Button type="submit" size="sm">
          Добавить активность
        </Button>
      </form>

      <ul className="space-y-2">
        {activities.map((a) => (
          <li key={a.id} className="rounded-md border border-slate-200 bg-white px-3 py-2">
            <div className="flex items-center justify-between gap-2 text-xs text-slate-500">
              <span>
                {ACTIVITY_TYPE_LABELS[a.type] || a.type} · {a.author?.name || "Система"}
              </span>
              <span>{formatDateTime(a.createdAt)}</span>
            </div>
            {a.comment && <div className="mt-1 text-sm text-slate-800">{a.comment}</div>}
          </li>
        ))}
        {activities.length === 0 && (
          <li className="text-sm text-slate-500">Пока нет активностей</li>
        )}
      </ul>
    </div>
  );
}
