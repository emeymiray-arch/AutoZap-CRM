import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";

export default async function CompanyEditRedirect({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const partner = await prisma.partner.findFirst({
    where: { companyId: id, archivedAt: null },
    select: { id: true },
  });
  redirect(partner ? `/partners/${partner.id}/edit` : "/partners");
}
