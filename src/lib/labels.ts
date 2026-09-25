export const LEAD_STATUS_LABELS: Record<string, string> = {
  NEW: "Новый",
  IN_PROGRESS: "В работе",
  NO_ANSWER: "Не дозвонились",
  CONTACTED: "Контакт установлен",
  QUALIFIED: "Квалифицирован",
  PROPOSAL_SENT: "КП отправлено",
  NEGOTIATION: "Переговоры",
  AGREED: "Согласие",
  REGISTRATION: "Регистрация",
  CONVERTED: "Конвертирован",
  REJECTED: "Отказ",
  NOT_SUITABLE: "Не подходит",
  DEFERRED: "На будущее",
};

export const DEAL_STAGE_LABELS: Record<string, string> = {
  NEW: "Новый",
  CONTACT: "Контакт",
  PROPOSAL: "КП",
  NEGOTIATION: "Переговоры",
  APPROVAL: "Согласование",
  REGISTRATION: "Регистрация",
  LAUNCH: "Запуск",
  WON: "Успешно",
  LOST: "Отказ",
};

export const PARTNER_STATUS_LABELS: Record<string, string> = {
  NEW: "Написали",
  CONTACTED: "Связались",
  ANSWERED: "Ответили",
  INFO_REQUESTED: "Запросили информацию",
  PROPOSAL_SENT: "Отправили КП",
  NEGOTIATION: "Переговоры",
  AGREED: "Согласие",
  ACTIVE: "Партнёр",
  REJECTED: "Отказ",
  // старые статусы (для уже существующих записей)
  REGISTRATION: "Регистрация",
  WAITING_CATALOG: "Ожидаем каталог",
  CATALOG_RECEIVED: "Каталог получен",
  CATALOG_REVIEW: "Каталог проверяется",
  CATALOG_UPLOAD: "Каталог передан на загрузку",
  STORE_PROCESSING: "Магазин в обработке",
  READY_TO_PUBLISH: "Готов к публикации",
  PUBLISHED: "Опубликован",
  NEEDS_ATTENTION: "Требует внимания",
  SUSPENDED: "Приостановлен",
  ARCHIVED: "Архив",
};

/** Воронка привлечения крупных компаний / партнёров */
export const PARTNER_FUNNEL_ORDER = [
  "NEW",
  "CONTACTED",
  "ANSWERED",
  "INFO_REQUESTED",
  "PROPOSAL_SENT",
  "NEGOTIATION",
  "AGREED",
  "ACTIVE",
  "REJECTED",
] as const;

export const STORE_STATUS_LABELS: Record<string, string> = {
  NEW: "Новый",
  CONTACTED: "Связались",
  ANSWERED: "Ответили",
  INTERESTED: "Заинтересованы",
  PROPOSAL_SENT: "КП",
  AGREED: "Согласие",
  ACTIVE: "Активен",
  REJECTED: "Отказ",
  // старые
  CREATING: "Создание",
  SETUP: "Настройка",
  CATALOG_LOADING: "Каталог загружается",
  REVIEW: "Проверка",
  READY: "Готов",
  PUBLISHED: "Опубликован",
  SUSPENDED: "Приостановлен",
  ARCHIVED: "Архив",
};

/** Воронка мелких магазинов */
export const STORE_FUNNEL_ORDER = [
  "NEW",
  "CONTACTED",
  "ANSWERED",
  "INTERESTED",
  "PROPOSAL_SENT",
  "AGREED",
  "ACTIVE",
  "REJECTED",
] as const;

export const CATALOG_STATUS_LABELS: Record<string, string> = {
  EXPECTED: "Ожидается",
  RECEIVED: "Получен",
  REVIEW: "Проверка",
  ERRORS: "Ошибки",
  FIXING: "Исправление",
  READY: "Готов",
  SENT_TO_UPLOAD: "Передан на загрузку",
  UPLOADED: "Загружен",
};

export const TASK_STATUS_LABELS: Record<string, string> = {
  NEW: "Новая",
  IN_PROGRESS: "В работе",
  REVIEW: "На проверке",
  DONE: "Выполнена",
  OVERDUE: "Просрочена",
  CANCELLED: "Отменена",
};

export const TASK_PRIORITY_LABELS: Record<string, string> = {
  LOW: "Низкий",
  MEDIUM: "Средний",
  HIGH: "Высокий",
  URGENT: "Срочный",
};

export const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Администратор программы",
  MANAGER_LEAD: "Руководитель",
  MANAGER: "Менеджер",
  OS_MANAGER: "Менеджер ОС",
};

export const ACTIVITY_TYPE_LABELS: Record<string, string> = {
  CALL: "Звонок",
  MESSAGE: "Сообщение",
  EMAIL: "Email",
  MEETING: "Встреча",
  COMMENT: "Комментарий",
  STATUS_CHANGE: "Изменение статуса",
  TASK_CREATED: "Создание задачи",
  TASK_DONE: "Выполнение задачи",
  FILE_UPLOAD: "Загрузка файла",
  CREATE: "Создание",
  UPDATE: "Изменение",
  ARCHIVE: "Архивирование",
  RESTORE: "Восстановление",
  CONVERT: "Конвертация",
};

export const DEAL_STAGES_ORDER = [
  "NEW",
  "CONTACT",
  "PROPOSAL",
  "NEGOTIATION",
  "APPROVAL",
  "REGISTRATION",
  "LAUNCH",
  "WON",
  "LOST",
] as const;

export const LEAD_FUNNEL_STAGES = [
  "NEW",
  "CONTACTED",
  "QUALIFIED",
  "PROPOSAL_SENT",
  "NEGOTIATION",
  "AGREED",
  "REGISTRATION",
  "CONVERTED",
] as const;

/** Старые статусы партнёра → колонка воронки */
export function partnerFunnelStage(status: string): string {
  if ((PARTNER_FUNNEL_ORDER as readonly string[]).includes(status)) return status;
  const map: Record<string, string> = {
    REGISTRATION: "AGREED",
    WAITING_CATALOG: "ACTIVE",
    CATALOG_RECEIVED: "ACTIVE",
    CATALOG_REVIEW: "ACTIVE",
    CATALOG_UPLOAD: "ACTIVE",
    STORE_PROCESSING: "ACTIVE",
    READY_TO_PUBLISH: "ACTIVE",
    PUBLISHED: "ACTIVE",
    NEEDS_ATTENTION: "NEGOTIATION",
    SUSPENDED: "REJECTED",
    ARCHIVED: "REJECTED",
  };
  return map[status] || "NEW";
}

/** Старые статусы магазина → колонка воронки */
export function storeFunnelStage(status: string): string {
  if ((STORE_FUNNEL_ORDER as readonly string[]).includes(status)) return status;
  const map: Record<string, string> = {
    CREATING: "NEW",
    SETUP: "CONTACTED",
    CATALOG_LOADING: "INTERESTED",
    REVIEW: "PROPOSAL_SENT",
    READY: "AGREED",
    PUBLISHED: "ACTIVE",
    SUSPENDED: "REJECTED",
    ARCHIVED: "REJECTED",
  };
  return map[status] || "NEW";
}

export function statusTone(status: string): "success" | "warning" | "error" | "neutral" | "info" {
  const s = status.toUpperCase();
  if (["WON", "DONE", "ACTIVE", "PUBLISHED", "CONVERTED", "UPLOADED", "READY", "AGREED"].includes(s)) return "success";
  if (["OVERDUE", "LOST", "REJECTED", "ERRORS", "NOT_SUITABLE"].includes(s)) return "error";
  if (["NEEDS_ATTENTION", "SUSPENDED", "NO_ANSWER", "FIXING", "DEFERRED"].includes(s)) return "warning";
  if (["NEW", "EXPECTED", "CREATING", "CONTACTED"].includes(s)) return "info";
  return "neutral";
}
