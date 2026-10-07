import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/layout/Page";
import { Button } from "@/components/ui/Button";
import { EntityCard, EntityCardGrid } from "@/components/crm/EntityCard";
import { scopeWhere } from "@/lib/list-query";

export default async function PeoplePage() {
  const session = await auth();
  if (!session?.user) return null;

  const rows = await prisma.person.findMany({
    where: { archivedAt: null, ...scopeWhere(session.user) },
    include: { responsible: true },
    orderBy: { updatedAt: "desc" },
    take: 500,
  });

  return (
    <div>
      <PageHeader
        title="Частники"
        description="Обычные люди — имя, телефон, город"
        actions={
          <Button href="/people/new" size="sm">
            + Добавить
          </Button>
        }
      />
      {rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
          Пока никого нет. Добавьте первого частника.
        </div>
      ) : (
        <EntityCardGrid>
          {rows.map((r) => (
            <EntityCard
              key={r.id}
              href={`/people/${r.id}`}
              title={r.name}
              lines={[
                { label: "Телефон", value: r.phone },
                { label: "Город", value: r.city },
                { label: "Кто вёл", value: r.responsible?.name },
              ]}
            />
          ))}
        </EntityCardGrid>
      )}
    </div>
  );
}
