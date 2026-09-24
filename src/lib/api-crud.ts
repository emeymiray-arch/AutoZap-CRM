import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireApiUser, jsonError, jsonOk } from "@/lib/api";
import { writeAudit, logActivity } from "@/lib/audit";
import { scopeWhere } from "@/lib/list-query";
import { archiveEntity, restoreEntity, hardDeleteEntity, changeStatus } from "@/lib/entity-actions";
import {
  assertCanAccessRecord,
  assertCanManageUsers,
  pickAllowed,
  publicUser,
} from "@/lib/access";
import { canManageUsers } from "@/lib/permissions";

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

function mapError(e: unknown) {
  if (e instanceof Error) {
    if (e.message === "NOT_FOUND") return jsonError("Not found", 404);
    if (e.message === "FORBIDDEN") return jsonError("Forbidden", 403);
    if (e.message.startsWith("Только администратор")) return jsonError(e.message, 403);
    return jsonError(e.message, 400);
  }
  return jsonError("Error", 500);
}

export async function listHandler(entity: Entity, req: NextRequest) {
  const user = await requireApiUser();
  if (user instanceof NextResponse) return user;
  if (entity === "users") {
    if (!canManageUsers(user.role)) {
      // Managers can only see id+name for assigns
      const rows = await prisma.user.findMany({
        where: { archivedAt: null, active: true },
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      });
      return jsonOk({ data: rows });
    }
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
  try {
    if (entity === "users") {
      const row = await prisma.user.findUnique({ where: { id } });
      if (!row) return jsonError("Not found", 404);
      if (!canManageUsers(user.role) && row.id !== user.id) {
        return jsonError("Forbidden", 403);
      }
      return jsonOk(publicUser(row));
    }
    const row = await model(entity).findUnique({ where: { id } });
    if (!row) return jsonError("Not found", 404);
    assertCanAccessRecord(user, row);
    return jsonOk(row);
  } catch (e) {
    return mapError(e);
  }
}

export async function createHandler(entity: Entity, req: NextRequest) {
  const user = await requireApiUser();
  if (user instanceof NextResponse) return user;
  if (entity === "users") return jsonError("Создание пользователей через Настройки или регистрацию", 403);
  try {
    const body = (await req.json()) as Record<string, unknown>;
    const allowed = pickAllowed(entity, body);
    const data = {
      ...allowed,
      responsibleId: (allowed.responsibleId as string) || user.id,
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
  } catch (e) {
    return mapError(e);
  }
}

export async function patchHandler(entity: Entity, id: string, req: NextRequest) {
  const user = await requireApiUser();
  if (user instanceof NextResponse) return user;
  try {
    if (entity === "users") {
      assertCanManageUsers(user);
      const body = (await req.json()) as Record<string, unknown>;
      const data: Record<string, unknown> = {};
      for (const k of ["name", "email", "role", "active"]) {
        if (body[k] !== undefined) data[k] = body[k];
      }
      const before = await prisma.user.findUnique({ where: { id } });
      if (!before) return jsonError("Not found", 404);
      const row = await prisma.user.update({ where: { id }, data });
      await writeAudit({
        userId: user.id,
        entityType: "user",
        entityId: id,
        action: "update",
        oldValue: publicUser(before),
        newValue: publicUser(row),
        summary: `${user.name} обновил(а) пользователя`,
      });
      return jsonOk(publicUser(row));
    }

    const before = await model(entity).findUnique({ where: { id } });
    if (!before) return jsonError("Not found", 404);
    assertCanAccessRecord(user, before);

    const body = (await req.json()) as Record<string, unknown>;
    const allowed = pickAllowed(entity, body);

    if (allowed.status && allowed.status !== before.status && entity !== "deals") {
      await changeStatus({
        entity: singular(entity) as never,
        id,
        newStatus: String(allowed.status),
        user,
      });
      delete allowed.status;
    }
    if (allowed.stage && allowed.stage !== before.stage && entity === "deals") {
      await changeStatus({ entity: "deal", id, newStatus: String(allowed.stage), user });
      delete allowed.stage;
    }

    const row = await model(entity).update({
      where: { id },
      data: allowed,
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
  } catch (e) {
    return mapError(e);
  }
}

export async function archiveHandler(entity: Entity, id: string) {
  const user = await requireApiUser();
  if (user instanceof NextResponse) return user;
  try {
    if (entity === "users") {
      assertCanManageUsers(user);
      const row = await prisma.user.update({
        where: { id },
        data: { archivedAt: new Date(), active: false },
      });
      return jsonOk(publicUser(row));
    }
    const before = await model(entity).findUnique({ where: { id } });
    assertCanAccessRecord(user, before);
    const row = await archiveEntity(singular(entity) as never, id, user);
    return jsonOk(row);
  } catch (e) {
    return mapError(e);
  }
}

export async function restoreHandler(entity: Entity, id: string) {
  const user = await requireApiUser();
  if (user instanceof NextResponse) return user;
  try {
    if (entity === "users") {
      assertCanManageUsers(user);
      const row = await prisma.user.update({
        where: { id },
        data: { archivedAt: null, active: true },
      });
      return jsonOk(publicUser(row));
    }
    const before = await model(entity).findUnique({ where: { id } });
    assertCanAccessRecord(user, before);
    const row = await restoreEntity(singular(entity) as never, id, user);
    return jsonOk(row);
  } catch (e) {
    return mapError(e);
  }
}

export async function deleteHandler(entity: Entity, id: string) {
  const user = await requireApiUser();
  if (user instanceof NextResponse) return user;
  try {
    if (entity === "users") return jsonError("Физическое удаление пользователей запрещено", 403);
    const before = await model(entity).findUnique({ where: { id } });
    assertCanAccessRecord(user, before);
    await hardDeleteEntity(singular(entity) as never, id, user);
    return jsonOk({ ok: true });
  } catch (e) {
    return mapError(e);
  }
}
