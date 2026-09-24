export type Role = "ADMIN" | "MANAGER_LEAD" | "MANAGER";

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: Role;
};

export function canViewAll(role: Role): boolean {
  return role === "ADMIN" || role === "MANAGER_LEAD";
}

export function canHardDelete(role: Role): boolean {
  return role === "ADMIN";
}

export function canManageUsers(role: Role): boolean {
  return role === "ADMIN";
}

export function canSeeAnalytics(role: Role): boolean {
  return role === "ADMIN" || role === "MANAGER_LEAD";
}

/** Scope filter for managers: only own responsible records */
export function responsibleScope(user: SessionUser): { responsibleId?: string } {
  if (canViewAll(user.role)) return {};
  return { responsibleId: user.id };
}

export function assertHardDelete(user: SessionUser) {
  if (!canHardDelete(user.role)) {
    throw new Error("Только администратор может окончательно удалить объект");
  }
}
