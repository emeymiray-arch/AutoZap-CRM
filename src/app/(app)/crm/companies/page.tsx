import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PageHeader, formatDate } from "@/components/layout/Page";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/ui/DataTable";
import { Badge } from "@/components/ui/Badge";
import { ListFilters } from "@/components/crm/ListFilters";
import { ExportButtons } from "@/components/crm/ExportButtons";
import { parseListParams, dateRange, scopeWhere, usersForSelect } from "@/lib/list-query";
import type { Prisma } from "@prisma/client";

export default async function CompaniesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await auth();
  if (!session?.user) return null;
  const raw = await searchParams;
  const sp = parseListParams(raw);
  const users = await usersForSelect();
  const savedFilters = await prisma.savedFilter.findMany({
    where: { userId: session.user.id, entityType: "companies" },
  });

  let responsibleId = sp.responsibleId;
  if (responsibleId === "me") responsibleId = session.user.id;

  const where: Prisma.CompanyWhereInput = {
    archivedAt: null,
    ...scopeWhere(session.user),
    ...(sp.status ? { status: sp.status } : {}),
    ...(responsibleId ? { responsibleId } : {}),
    ...(sp.region ? { region: { contains: sp.region } } : {}),
    ...(dateRange(sp.from, sp.to) ? { createdAt: dateRange(sp.from, sp.to) } : {}),
    ...(sp.q
      ? {
          OR: [
            { name: { contains: sp.q } },
            { inn: { contains: sp.q } },
            { phone: { contains: sp.q } },
            { email: { contains: sp.q } },
            { city: { contains: sp.q } },
          ],
        }
      : {}),
  };

  const companies = await prisma.company.findMany({
    where,
    include: { responsible: true },
    orderBy: { updatedAt: "desc" },
    take: 200,
  });

  return (
    <div>
      <PageHeader
        title="Компании"
        description={`${companies.length} записей`}
        actions={
          <>
            <ExportButtons entity="companies" />
            <Button href="/crm/companies/new" size="sm">
              + Создать
            </Button>
          </>
        }
      />
      <Suspense>
        <ListFilters
          entityType="companies"
          users={users}
          savedFilters={savedFilters}
          showRegion
          statusOptions={[
            { value: "ACTIVE", label: "Активна" },
            { value: "INACTIVE", label: "Неактивна" },
          ]}
        />
      </Suspense>
      <div className="mb-2 flex flex-wrap gap-2 text-xs">
        <Button href="/crm/companies?responsibleId=me" variant="ghost" size="sm">
          Мои компании
        </Button>
      </div>
      <DataTable
        rows={companies}
        href={(r) => `/crm/companies/${r.id}`}
        columns={[
          { key: "name", header: "Название", render: (r) => r.name },
          { key: "inn", header: "ИНН", render: (r) => r.inn || "—" },
          { key: "city", header: "Город", render: (r) => r.city || "—" },
          {
            key: "status",
            header: "Статус",
            render: (r) => <Badge status={r.status}>{r.status}</Badge>,
          },
          { key: "resp", header: "Ответственный", render: (r) => r.responsible?.name || "—" },
          { key: "created", header: "Создана", render: (r) => formatDate(r.createdAt) },
        ]}
      />
    </div>
  );
}
