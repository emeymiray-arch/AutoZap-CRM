export type Role = "ADMIN" | "MANAGER_LEAD" | "MANAGER" | "OS_MANAGER";

/** Роли, которые администратор выдаёт менеджерам и руководителям */
export const SELECTABLE_ROLES: { value: Role; label: string; hint: string }[] = [
  {
    value: "MANAGER",
    label: "Менеджер",
    hint: "Видит общую базу, партнёров, магазины и свои задачи",
  },
  {
    value: "MANAGER_LEAD",
    label: "Руководитель",
    hint: "Видит команду и аналитику",
  },
];

export function isSelectableRole(role: string): role is Role {
  return SELECTABLE_ROLES.some((r) => r.value === role);
}

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: Role;
};

export function canViewAll(role: Role): boolean {
  return role === "ADMIN" || role === "MANAGER_LEAD" || role === "OS_MANAGER";
}

export function canHardDelete(role: Role): boolean {
  return role === "ADMIN";
}

/** Только администратор программы создаёт аккаунты */
export function canManageUsers(role: Role): boolean {
  return role === "ADMIN";
}

export function canSeeAnalytics(role: Role): boolean {
  return role === "ADMIN" || role === "MANAGER_LEAD" || role === "OS_MANAGER";
}

/** Экспорт / импорт / Bitrix — администратор и руководство, не менеджеры */
export function canExportData(role: Role): boolean {
  return role === "ADMIN" || role === "MANAGER_LEAD" || role === "OS_MANAGER";
}

/** Настройки с созданием аккаунтов — только администратор программы */
export function canAccessSettings(role: Role): boolean {
  return role === "ADMIN";
}

/** Дневник ЗП сотрудников — руководитель и администратор */
export function canAccessPayroll(role: Role): boolean {
  return role === "ADMIN" || role === "MANAGER_LEAD";
}

/** Общая база команды: все роли видят все активные записи CRM */
export function canSeeTeamRecords(role: Role): boolean {
  void role;
  return true;
}

export function responsibleScope(user: SessionUser): { responsibleId?: string } {
  if (canSeeTeamRecords(user.role)) return {};
  return { responsibleId: user.id };
}

/** Админ и руководитель могут ставить задачи коллегам и всей команде */
export function canAssignTasksToOthers(role: Role): boolean {
  return role === "ADMIN" || role === "MANAGER_LEAD";
}

export function assertHardDelete(user: SessionUser) {
  if (!canHardDelete(user.role)) {
    throw new Error("Недостаточно прав для окончательного удаления");
  }
}
