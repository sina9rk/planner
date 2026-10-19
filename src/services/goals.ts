import "server-only";
import { prisma } from "@/lib/prisma";

/**
 * دسترسی به دادهٔ هدف و لاگ‌های آن. محاسبه‌های پیشرفت در lib/goals می‌مانند؛
 * این‌جا فقط کوئری‌ها هستند.
 */

/** اهداف کاربر با لاگ‌های داخل بازه (برای پیشرفت هفتگی). */
export function listGoalsWithLogsSince(userId: string, since: Date) {
  return prisma.goal.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
    include: {
      logs: {
        where: { loggedAt: { gte: since } },
        select: { durationMinutes: true, loggedAt: true },
      },
    },
  });
}

export function listGoalLogDatesSince(userId: string, since: Date) {
  return prisma.goalLog.findMany({
    where: { userId, loggedAt: { gte: since } },
    select: { loggedAt: true },
  });
}

/** صفحهٔ جزئیات هدف؛ شرط userId همان کنترل مالکیت است. */
export function findGoalDetail(goalId: string, userId: string) {
  return prisma.goal.findFirst({
    where: { id: goalId, userId },
    include: {
      logs: {
        orderBy: { loggedAt: "desc" },
        take: 200,
      },
      tasks: {
        orderBy: { createdAt: "asc" },
      },
    },
  });
}

/** خلاصهٔ هدف مالک، برای اکشن‌هایی که فقط عنوانش را در Event می‌خواهند. */
export function findOwnedGoalSummary(goalId: string, userId: string) {
  return prisma.goal.findFirst({
    where: { id: goalId, userId },
    select: { id: true, title: true },
  });
}

/** تأیید مالکیت هدف؛ برای اکشن‌هایی که فقط id لازم دارند. */
export function findOwnedGoal(goalId: string, userId: string) {
  return prisma.goal.findFirst({
    where: { id: goalId, userId },
    select: { id: true },
  });
}

export type NewGoal = {
  userId: string;
  title: string;
  targetMinutesPerWeek: number | null;
  targetDaysPerWeek: number | null;
  reminderTime: string | null;
  reminderDays: number[];
};

export function createGoal(data: NewGoal) {
  return prisma.goal.create({ data });
}

export type NewGoalLog = {
  goalId: string;
  userId: string;
  taskId?: string | null;
  durationMinutes: number;
  note?: string | null;
};

export function createGoalLog(data: NewGoalLog) {
  return prisma.goalLog.create({
    data: {
      ...data,
      taskId: data.taskId ?? null,
      note: data.note ?? null,
    },
  });
}

/** حذف با شرط مالکیت؛ count صفر یعنی هدف مال این کاربر نبوده. */
export function deleteOwnedGoal(goalId: string, userId: string) {
  return prisma.goal.deleteMany({ where: { id: goalId, userId } });
}
