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
  NEW: "Новый",
  REGISTRATION: "Регистрация",
  WAITING_CATALOG: "Ожидаем каталог",
  CATALOG_RECEIVED: "Каталог получен",
  CATALOG_REVIEW: "Каталог проверяется",
  CATALOG_UPLOAD: "Каталог передан на загрузку",
  STORE_PROCESSING: "Магазин в обработке",
  READY_TO_PUBLISH: "Готов к публикации",
  PUBLISHED: "Опубликован",
  ACTIVE: "Активен",
  NEEDS_ATTENTION: "Требует внимания",
  SUSPENDED: "Приостановлен",
  ARCHIVED: "Архив",
};

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

export const STORE_STATUS_LABELS: Record<string, string> = {
  CREATING: "Создание",
  SETUP: "Настройка",
  CATALOG_LOADING: "Каталог загружается",
  REVIEW: "Проверка",
  READY: "Готов",
  PUBLISHED: "Опубликован",
  ACTIVE: "Активен",
  SUSPENDED: "Приостановлен",
  ARCHIVED: "Архив",
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

export function statusTone(status: string): "success" | "warning" | "error" | "neutral" | "info" {
  const s = status.toUpperCase();
  if (["WON", "DONE", "ACTIVE", "PUBLISHED", "CONVERTED", "UPLOADED", "READY"].includes(s)) return "success";
  if (["OVERDUE", "LOST", "REJECTED", "ERRORS", "NOT_SUITABLE"].includes(s)) return "error";
  if (["NEEDS_ATTENTION", "SUSPENDED", "NO_ANSWER", "FIXING", "DEFERRED"].includes(s)) return "warning";
  if (["NEW", "EXPECTED", "CREATING"].includes(s)) return "info";
  return "neutral";
}
