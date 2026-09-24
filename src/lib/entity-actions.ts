import { prisma } from "./db";
import { writeAudit, writeStatusHistory, logActivity } from "./audit";
import { runAutomations } from "./automations";
import { assertHardDelete, type SessionUser } from "./permissions";

type EntityKey =
  | "company"
  | "contact"
  | "lead"
  | "deal"
  | "partner"
  | "catalog"
  | "store"
  | "task";

const statusField: Partial<Record<EntityKey, string>> = {
  lead: "status",
  deal: "stage",
  partner: "status",
  catalog: "status",
  store: "status",
  task: "status",
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function model(entity: EntityKey): any {
  const map = {
    company: prisma.company,
    contact: prisma.contact,
    lead: prisma.lead,
    deal: prisma.deal,
    partner: prisma.partner,
    catalog: prisma.catalog,
    store: prisma.store,
    task: prisma.task,
  };
  return map[entity];
}

export async function archiveEntity(entity: EntityKey, id: string, user: SessionUser) {
  const m = model(entity);
  const existing = await m.findUnique({ where: { id } });
  if (!existing) throw new Error("Не найдено");
  if (existing.archivedAt) throw new Error("Уже в архиве");

  const updated = await m.update({
    where: { id },
    data: { archivedAt: new Date() },
  });

  await writeAudit({
    userId: user.id,
    entityType: entity,
    entityId: id,
    action: "archive",
    oldValue: { archivedAt: null },
    newValue: { archivedAt: updated.archivedAt },
    summary: `${user.name} архивировал(а) ${entity}`,
  });
  await logActivity({
    type: "ARCHIVE",
    authorId: user.id,
    comment: `Архивировано`,
    companyId: existing.companyId,
    leadId: entity === "lead" ? id : existing.leadId,
    dealId: entity === "deal" ? id : existing.dealId,
    partnerId: entity === "partner" ? id : existing.partnerId,
  });

  return updated;
}

export async function restoreEntity(entity: EntityKey, id: string, user: SessionUser) {
  const m = model(entity);
  const existing = await m.findUnique({ where: { id } });
  if (!existing) throw new Error("Не найдено");
  if (!existing.archivedAt) throw new Error("Объект не в архиве");

  const updated = await m.update({
    where: { id },
    data: { archivedAt: null },
  });

  await writeAudit({
    userId: user.id,
    entityType: entity,
    entityId: id,
    action: "restore",
    summary: `${user.name} восстановил(а) ${entity}`,
  });
  await logActivity({
    type: "RESTORE",
    authorId: user.id,
    comment: `Восстановлено`,
  });

  return updated;
}

export async function hardDeleteEntity(entity: EntityKey, id: string, user: SessionUser) {
  assertHardDelete(user);
  const m = model(entity);
  const existing = await m.findUnique({ where: { id } });
  if (!existing) throw new Error("Не найдено");
  if (!existing.archivedAt) throw new Error("Сначала архивируйте объект");

  await writeAudit({
    userId: user.id,
    entityType: entity,
    entityId: id,
    action: "hard_delete",
    oldValue: existing,
    summary: `Администратор окончательно удалил ${entity} ${id}`,
  });

  await m.delete({ where: { id } });
  return { ok: true };
}

export async function changeStatus(input: {
  entity: EntityKey;
  id: string;
  newStatus: string;
  user: SessionUser;
  rejectReason?: string;
}) {
  const { entity, id, newStatus, user } = input;
  const field = statusField[entity];
  if (!field) throw new Error("У сущности нет статуса");

  const m = model(entity);
  const existing = await m.findUnique({ where: { id } });
  if (!existing) throw new Error("Не найдено");
  if (existing.archivedAt) throw new Error("Объект в архиве");

  const oldStatus = existing[field] as string;
  if (oldStatus === newStatus) return existing;

  const data: Record<string, unknown> = { [field]: newStatus };
  if (entity === "lead" && input.rejectReason) data.rejectReason = input.rejectReason;

  const updated = await m.update({ where: { id }, data });

  await writeStatusHistory({
    entityType: entity,
    entityId: id,
    field,
    oldValue: oldStatus,
    newValue: newStatus,
    userId: user.id,
  });

  await writeAudit({
    userId: user.id,
    entityType: entity,
    entityId: id,
    action: "status_change",
    oldValue: { [field]: oldStatus },
    newValue: { [field]: newStatus },
    summary: `${user.name} изменил(а) статус ${entity}: ${oldStatus} → ${newStatus}`,
  });

  await logActivity({
    type: "STATUS_CHANGE",
    authorId: user.id,
    comment: `${oldStatus} → ${newStatus}`,
    companyId: existing.companyId,
    leadId: entity === "lead" ? id : existing.leadId,
    dealId: entity === "deal" ? id : existing.dealId,
    partnerId: entity === "partner" ? id : existing.partnerId,
    catalogId: entity === "catalog" ? id : undefined,
    storeId: entity === "store" ? id : undefined,
    taskId: entity === "task" ? id : undefined,
  });

  await runAutomations({
    entityType: entity,
    entityId: id,
    newStatus,
    userId: user.id,
    responsibleId: existing.responsibleId,
    companyId: existing.companyId,
    leadId: entity === "lead" ? id : existing.leadId,
    dealId: entity === "deal" ? id : existing.dealId,
    partnerId: entity === "partner" ? id : existing.partnerId,
  });

  return updated;
}

export async function trackFieldChanges(
  entity: EntityKey,
  id: string,
  user: SessionUser,
  before: Record<string, unknown>,
  after: Record<string, unknown>
) {
  const changes: Record<string, { old: unknown; new: unknown }> = {};
  for (const key of Object.keys(after)) {
    if (["updatedAt", "createdAt"].includes(key)) continue;
    const o = before[key];
    const n = after[key];
    if (JSON.stringify(o) !== JSON.stringify(n)) {
      changes[key] = { old: o, new: n };
    }
  }
  if (Object.keys(changes).length === 0) return;

  await writeAudit({
    userId: user.id,
    entityType: entity,
    entityId: id,
    action: "update",
    oldValue: Object.fromEntries(Object.entries(changes).map(([k, v]) => [k, v.old])),
    newValue: Object.fromEntries(Object.entries(changes).map(([k, v]) => [k, v.new])),
    summary: `${user.name} изменил(а) ${entity}`,
  });

  const statusKey = statusField[entity];
  if (statusKey && changes[statusKey]) {
    await writeStatusHistory({
      entityType: entity,
      entityId: id,
      field: statusKey,
      oldValue: String(changes[statusKey].old ?? ""),
      newValue: String(changes[statusKey].new ?? ""),
      userId: user.id,
    });
    await runAutomations({
      entityType: entity,
      entityId: id,
      newStatus: String(changes[statusKey].new),
      userId: user.id,
      responsibleId: (after.responsibleId as string) || null,
      companyId: (after.companyId as string) || null,
    });
  }
}
