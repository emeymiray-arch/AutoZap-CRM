import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";

/** Старые ссылки на компанию ведут на связанного партнёра */
export default async function CompanyDetailRedirect({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const partner = await prisma.partner.findFirst({
    where: { companyId: id, archivedAt: null },
    select: { id: true },
  });
  redirect(partner ? `/partners/${partner.id}` : "/partners");
}
