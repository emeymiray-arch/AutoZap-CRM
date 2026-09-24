import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireApiUser, jsonError, jsonOk } from "@/lib/api";
import { writeAudit, logActivity } from "@/lib/audit";
import { scopeWhere } from "@/lib/list-query";
import { archiveEntity, restoreEntity, hardDeleteEntity, changeStatus } from "@/lib/entity-actions";

type Entity =
  | "companies"
  | "contacts"
  | "leads"
  | "deals"
  | "partners"
  | "catalogs"
  | "stores"
  | "tasks"
  | "users";

function singular(e: Entity) {
  const map: Record<Entity, string> = {
    companies: "company",
    contacts: "contact",
    leads: "lead",
    deals: "deal",
    partners: "partner",
    catalogs: "catalog",
    stores: "store",
    tasks: "task",
    users: "user",
  };
  return map[e];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function model(e: Entity): any {
  const map = {
    companies: prisma.company,
    contacts: prisma.contact,
    leads: prisma.lead,
    deals: prisma.deal,
    partners: prisma.partner,
    catalogs: prisma.catalog,
    stores: prisma.store,
    tasks: prisma.task,
    users: prisma.user,
  };
  return map[e];
}

export async function listHandler(entity: Entity, req: NextRequest) {
  const user = await requireApiUser();
  if (user instanceof NextResponse) return user;
  if (entity === "users") {
    const rows = await prisma.user.findMany({
      where: { archivedAt: null },
      select: { id: true, name: true, email: true, role: true, active: true, createdAt: true },
    });
    return jsonOk({ data: rows });
  }
  const archived = req.nextUrl.searchParams.get("archived") === "1";
  const rows = await model(entity).findMany({
    where: {
      archivedAt: archived ? { not: null } : null,
      ...scopeWhere(user),
    },
    orderBy: { updatedAt: "desc" },
    take: 200,
  });
  return jsonOk({ data: rows });
}

export async function getHandler(entity: Entity, id: string) {
  const user = await requireApiUser();
  if (user instanceof NextResponse) return user;
  const row = await model(entity).findUnique({ where: { id } });
  if (!row) return jsonError("Not found", 404);
  return jsonOk(row);
}

export async function createHandler(entity: Entity, req: NextRequest) {
  const user = await requireApiUser();
  if (user instanceof NextResponse) return user;
  if (entity === "users") return jsonError("Use settings UI / seed for users", 403);
  const body = await req.json();
  const data = {
    ...body,
    responsibleId: body.responsibleId || user.id,
    createdById: user.id,
  };
  const row = await model(entity).create({ data });
  await writeAudit({
    userId: user.id,
    entityType: singular(entity),
    entityId: row.id,
    action: "create",
    newValue: row,
    summary: `${user.name} создал(а) ${singular(entity)} через API`,
  });
  await logActivity({
    type: "CREATE",
    authorId: user.id,
    comment: `API create ${singular(entity)}`,
  });
  return jsonOk(row, 201);
}

export async function patchHandler(entity: Entity, id: string, req: NextRequest) {
  const user = await requireApiUser();
  if (user instanceof NextResponse) return user;
  const body = await req.json();
  const before = await model(entity).findUnique({ where: { id } });
  if (!before) return jsonError("Not found", 404);

  if (body.status && body.status !== before.status && entity !== "deals") {
    await changeStatus({
      entity: singular(entity) as never,
      id,
      newStatus: body.status,
      user,
    });
  }
  if (body.stage && body.stage !== before.stage && entity === "deals") {
    await changeStatus({ entity: "deal", id, newStatus: body.stage, user });
  }

  const { status, stage, ...rest } = body;
  void status;
  void stage;
  const row = await model(entity).update({
    where: { id },
    data: rest,
  });
  await writeAudit({
    userId: user.id,
    entityType: singular(entity),
    entityId: id,
    action: "update",
    oldValue: before,
    newValue: row,
    summary: `${user.name} обновил(а) ${singular(entity)} через API`,
  });
  return jsonOk(row);
}

export async function archiveHandler(entity: Entity, id: string) {
  const user = await requireApiUser();
  if (user instanceof NextResponse) return user;
  const row = await archiveEntity(singular(entity) as never, id, user);
  return jsonOk(row);
}

export async function restoreHandler(entity: Entity, id: string) {
  const user = await requireApiUser();
  if (user instanceof NextResponse) return user;
  const row = await restoreEntity(singular(entity) as never, id, user);
  return jsonOk(row);
}

export async function deleteHandler(entity: Entity, id: string) {
  const user = await requireApiUser();
  if (user instanceof NextResponse) return user;
  await hardDeleteEntity(singular(entity) as never, id, user);
  return jsonOk({ ok: true });
}
