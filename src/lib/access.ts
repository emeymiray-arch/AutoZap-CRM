import { canManageUsers, canViewAll, type SessionUser } from "./permissions";

export function assertCanAccessRecord(
  user: SessionUser,
  record: { responsibleId?: string | null } | null | undefined
) {
  if (!record) {
    const err = new Error("NOT_FOUND");
    throw err;
  }
  if (canViewAll(user.role)) return;
  if (record.responsibleId && record.responsibleId !== user.id) {
    const err = new Error("FORBIDDEN");
    throw err;
  }
}

export function assertCanManageUsers(user: SessionUser) {
  if (!canManageUsers(user.role)) {
    throw new Error("FORBIDDEN");
  }
}

/** Strip sensitive fields from user objects before API responses */
export function publicUser<T extends { passwordHash?: string; adminPassword?: string | null }>(u: T) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { passwordHash, adminPassword, ...rest } = u;
  return rest;
}

export const CREATE_ALLOWLIST: Record<string, string[]> = {
  companies: [
    "name",
    "legalForm",
    "inn",
    "city",
    "region",
    "address",
    "phone",
    "email",
    "website",
    "companyType",
    "skuCount",
    "categories",
    "notes",
    "status",
    "responsibleId",
    "nextContactAt",
    "lastContactAt",
  ],
  contacts: [
    "firstName",
    "lastName",
    "position",
    "phone",
    "email",
    "telegram",
    "whatsapp",
    "companyId",
    "responsibleId",
    "comment",
  ],
  leads: [
    "title",
    "companyId",
    "contactId",
    "phone",
    "email",
    "city",
    "region",
    "source",
    "website",
    "avito",
    "wildberries",
    "ozon",
    "businessType",
    "assortment",
    "responsibleId",
    "status",
    "nextContactAt",
    "lastContactAt",
    "comment",
    "rejectReason",
  ],
  deals: [
    "title",
    "companyId",
    "contactId",
    "leadId",
    "responsibleId",
    "stage",
    "source",
    "amount",
    "nextStep",
    "deadline",
    "comment",
  ],
  partners: [
    "name",
    "companyId",
    "leadId",
    "responsibleId",
    "status",
    "region",
    "comment",
    "nextContactAt",
    "lastContactAt",
  ],
  catalogs: [
    "name",
    "partnerId",
    "companyId",
    "status",
    "skuCount",
    "receivedAt",
    "responsibleId",
    "comment",
  ],
  stores: [
    "name",
    "companyId",
    "partnerId",
    "region",
    "status",
    "productCount",
    "responsibleId",
    "storeUrl",
    "comment",
  ],
  tasks: [
    "title",
    "description",
    "responsibleId",
    "companyId",
    "contactId",
    "leadId",
    "dealId",
    "partnerId",
    "deadline",
    "priority",
    "status",
  ],
};

export function pickAllowed(entity: string, body: Record<string, unknown>) {
  const keys = CREATE_ALLOWLIST[entity] || [];
  const out: Record<string, unknown> = {};
  for (const k of keys) {
    if (body[k] !== undefined) out[k] = body[k];
  }
  return out;
}

export function containsInsensitive(q: string) {
  return { contains: q, mode: "insensitive" as const };
}
