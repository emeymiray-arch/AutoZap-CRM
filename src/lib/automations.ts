import { prisma } from "./db";
import { logActivity, writeAudit } from "./audit";

export async function notifyUser(userId: string | null | undefined, title: string, body?: string, link?: string) {
  if (!userId) return;
  return prisma.notification.create({
    data: { userId, title, body, link },
  });
}

export async function createAutoTask(input: {
  title: string;
  description?: string;
  responsibleId?: string | null;
  creatorId?: string | null;
  companyId?: string | null;
  leadId?: string | null;
  dealId?: string | null;
  partnerId?: string | null;
  deadlineDays?: number;
}) {
  const deadline = new Date();
  deadline.setDate(deadline.getDate() + (input.deadlineDays ?? 2));

  const task = await prisma.task.create({
    data: {
      title: input.title,
      description: input.description,
      responsibleId: input.responsibleId || undefined,
      creatorId: input.creatorId || undefined,
      companyId: input.companyId || undefined,
      leadId: input.leadId || undefined,
      dealId: input.dealId || undefined,
      partnerId: input.partnerId || undefined,
      deadline,
      status: "NEW",
      priority: "MEDIUM",
    },
  });

  await logActivity({
    type: "TASK_CREATED",
    authorId: input.creatorId,
    comment: `Автозадача: ${task.title}`,
    companyId: input.companyId,
    leadId: input.leadId,
    dealId: input.dealId,
    partnerId: input.partnerId,
    taskId: task.id,
  });

  await notifyUser(
    input.responsibleId,
    "Новая задача",
    task.title,
    `/tasks/${task.id}`
  );

  return task;
}

/** In-process automation rules on status transitions */
export async function runAutomations(input: {
  entityType: string;
  entityId: string;
  newStatus: string;
  userId?: string | null;
  responsibleId?: string | null;
  companyId?: string | null;
  leadId?: string | null;
  dealId?: string | null;
  partnerId?: string | null;
}) {
  const { entityType, newStatus, userId, responsibleId, companyId, partnerId, entityId } = input;
  void input.leadId;
  void input.dealId;

  if (entityType === "lead" && newStatus === "PROPOSAL_SENT") {
    await createAutoTask({
      title: "Связаться с клиентом",
      description: "Автоматически после отправки КП",
      responsibleId,
      creatorId: userId,
      companyId,
      leadId: entityId,
      deadlineDays: 1,
    });
  }

  if (entityType === "partner" && newStatus === "WAITING_CATALOG") {
    await createAutoTask({
      title: "Получить каталог",
      description: "Партнёр ожидает каталог",
      responsibleId,
      creatorId: userId,
      companyId,
      partnerId: entityId,
      deadlineDays: 3,
    });
  }

  if (entityType === "catalog" && newStatus === "RECEIVED") {
    await createAutoTask({
      title: "Проверить каталог",
      description: "Каталог получен — нужна проверка",
      responsibleId,
      creatorId: userId,
      companyId,
      partnerId,
      deadlineDays: 1,
    });
  }

  if (entityType === "catalog" && newStatus === "READY") {
    await createAutoTask({
      title: "Передать на загрузку",
      description: "Каталог готов к загрузке",
      responsibleId,
      creatorId: userId,
      companyId,
      partnerId,
      deadlineDays: 1,
    });
  }

  if (entityType === "store" && newStatus === "PUBLISHED") {
    await createAutoTask({
      title: "Проверить запуск",
      description: "Магазин опубликован — проверить запуск",
      responsibleId,
      creatorId: userId,
      companyId,
      partnerId,
      deadlineDays: 2,
    });
  }

  await writeAudit({
    userId,
    entityType,
    entityId,
    action: "automation_check",
    newValue: { newStatus },
    summary: `Проверка автоматизаций для ${entityType} → ${newStatus}`,
  });
}

/** Mark overdue tasks and notify */
export async function processOverdueTasks() {
  const now = new Date();
  const overdue = await prisma.task.findMany({
    where: {
      archivedAt: null,
      deadline: { lt: now },
      status: { in: ["NEW", "IN_PROGRESS", "REVIEW"] },
    },
  });

  for (const task of overdue) {
    await prisma.task.update({
      where: { id: task.id },
      data: { status: "OVERDUE" },
    });
    await notifyUser(
      task.responsibleId,
      "Просроченная задача",
      task.title,
      `/tasks/${task.id}`
    );
  }

  return overdue.length;
}
