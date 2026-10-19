import "server-only";
import type { TaskStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/**
 * دسترسی به دادهٔ تسک. عملیات ترکیبی تسک + لاگ هدف هم اینجا تراکنش می‌شوند تا
 * اکشن‌ها فقط تصمیم‌های دامنه‌ای بگیرند.
 */

/** فهرست تسک‌های کاربر همراه عنوان هدف، برای صفحهٔ تسک‌ها. */
export function listTasksForUser(userId: string) {
  return prisma.task.findMany({
    where: { userId },
    orderBy: [
      { status: "asc" },
      { scheduledFor: "asc" },
      { createdAt: "desc" },
    ],
    include: {
      goal: {
        select: { id: true, title: true },
      },
    },
  });
}

export function findOwnedTaskSummary(taskId: string, userId: string) {
  return prisma.task.findFirst({
    where: { id: taskId, userId },
    select: { id: true, title: true, goalId: true, status: true },
  });
}

export function findOwnedTask(taskId: string, userId: string) {
  return prisma.task.findFirst({
    where: { id: taskId, userId },
    select: { id: true },
  });
}

export function setTaskStatus(
  taskId: string,
  status: TaskStatus,
  completedAt: Date | null,
) {
  return prisma.task.update({
    where: { id: taskId },
    data: { status, completedAt },
  });
}

/**
 * تیک‌زدن/برداشتن تیک تسک. هنگام تکمیل، اگر تسک زیر هدف باشد و مدت مشخص شده
 * باشد، لاگ هدف در همان تراکنش ساخته می‌شود تا آمار نیمه‌کاره نماند.
 */
export async function updateTaskCompletion(input: {
  taskId: string;
  userId: string;
  completed: boolean;
  goalId: string | null;
  durationMinutes?: number;
  note?: string | null;
}) {
  const { taskId, userId, completed, goalId } = input;
  const duration = input.durationMinutes ?? 0;

  await prisma.$transaction(async (tx) => {
    await tx.task.update({
      where: { id: taskId },
      data: {
        status: completed ? "COMPLETED" : "PENDING",
        completedAt: completed ? new Date() : null,
      },
    });

    if (completed && goalId && duration > 0) {
      await tx.goalLog.create({
        data: {
          goalId,
          userId,
          taskId,
          durationMinutes: duration,
          note: input.note ?? null,
        },
      });
    }
  });
}

export type NewTask = {
  userId: string;
  title: string;
  description: string | null;
  scheduledFor: Date | null;
  deadline: Date | null;
  goalId?: string;
  parentTaskId?: string;
};

export function createTask(data: NewTask) {
  return prisma.task.create({ data });
}
