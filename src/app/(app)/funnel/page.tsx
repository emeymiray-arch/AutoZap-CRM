import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/layout/Page";
import { Button } from "@/components/ui/Button";
import { DealKanban } from "@/components/kanban/DealKanban";
import { scopeWhere } from "@/lib/list-query";

export default async function FunnelPage() {
  const session = await auth();
  if (!session?.user) return null;

  const deals = await prisma.deal.findMany({
    where: { archivedAt: null, ...scopeWhere(session.user) },
    include: { company: true, responsible: true },
    orderBy: { updatedAt: "desc" },
    take: 500,
  });

  const kanbanDeals = deals.map((d) => ({
    id: d.id,
    title: d.title,
    stage: d.stage,
    amount: d.amount,
    companyName: d.company?.name || null,
    responsibleName: d.responsible?.name || null,
  }));

  return (
    <div>
      <PageHeader
        title="Воронка сделок"
        description={`${deals.length} активных сделок`}
        actions={
          <Button href="/crm/deals/new" size="sm">
            + Сделка
          </Button>
        }
      />
      <DealKanban initialDeals={kanbanDeals} />
    </div>
  );
}
