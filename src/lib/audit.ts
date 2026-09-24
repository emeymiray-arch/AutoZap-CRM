import { prisma } from "./db";

type AuditInput = {
  userId?: string | null;
  entityType: string;
  entityId: string;
  action: string;
  oldValue?: unknown;
  newValue?: unknown;
  summary?: string;
};

export async function writeAudit(input: AuditInput) {
  return prisma.auditLog.create({
    data: {
      userId: input.userId || undefined,
      entityType: input.entityType,
      entityId: input.entityId,
      action: input.action,
      oldValue: input.oldValue != null ? JSON.stringify(input.oldValue) : null,
      newValue: input.newValue != null ? JSON.stringify(input.newValue) : null,
      summary: input.summary,
    },
  });
}

export async function writeStatusHistory(input: {
  entityType: string;
  entityId: string;
  field?: string;
  oldValue?: string | null;
  newValue?: string | null;
  userId?: string | null;
}) {
  return prisma.statusHistory.create({
    data: {
      entityType: input.entityType,
      entityId: input.entityId,
      field: input.field || "status",
      oldValue: input.oldValue ?? null,
      newValue: input.newValue ?? null,
      userId: input.userId || undefined,
    },
  });
}

export async function logActivity(input: {
  type: string;
  authorId?: string | null;
  comment?: string;
  companyId?: string | null;
  contactId?: string | null;
  leadId?: string | null;
  dealId?: string | null;
  partnerId?: string | null;
  catalogId?: string | null;
  storeId?: string | null;
  taskId?: string | null;
  meta?: unknown;
}) {
  return prisma.activity.create({
    data: {
      type: input.type as never,
      authorId: input.authorId || undefined,
      comment: input.comment,
      companyId: input.companyId || undefined,
      contactId: input.contactId || undefined,
      leadId: input.leadId || undefined,
      dealId: input.dealId || undefined,
      partnerId: input.partnerId || undefined,
      catalogId: input.catalogId || undefined,
      storeId: input.storeId || undefined,
      taskId: input.taskId || undefined,
      meta: input.meta != null ? JSON.stringify(input.meta) : null,
    },
  });
}
