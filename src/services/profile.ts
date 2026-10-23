import "server-only";
import { prisma } from "@/lib/prisma";

/**
 * کوئری‌های آمار پروفایل. محاسبه‌ها در صفحهٔ پروفایل و lib/stats می‌مانند؛
 * این‌جا فقط داده‌های خام جمع می‌شوند.
 */

/** خلاصهٔ آمار پروفایل: لاگ‌ها، شمارش تسک‌ها، روزهای فعال. */
export async function getProfileOverview(userId: string, sinceWeek: Date) {
  const goalLogs = await prisma.goalLog.findMany({
    where: { userId },
    select: { loggedAt: true },
  });

  const [completedTasks, allTasks, activeGoals] = await Promise.all([
    prisma.task.count({
      where: { userId, status: "COMPLETED", parentTaskId: null },
    }),
    prisma.task.count({
      where: { userId, parentTaskId: null },
    }),
    prisma.goal.count({
      where: { userId, archivedAt: null },
    }),
  ]);

  const activeDaysSet = new Set<string>();

  for (const log of goalLogs) {
    const d = log.loggedAt;
    activeDaysSet.add(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`);
  }

  const weekCompletedTasks = await prisma.task.findMany({
    where: {
      userId,
      status: "COMPLETED",
      parentTaskId: null,
      completedAt: { gte: sinceWeek },
    },
    select: { completedAt: true },
  });

  for (const t of weekCompletedTasks) {
    if (t.completedAt) {
      const d = t.completedAt;
      activeDaysSet.add(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`);
    }
  }

  return {
    activeDays: activeDaysSet.size,
    activeGoals,
    completedTasks,
    allTasks,
  };
}

/** دادهٔ خام profileStats در lib/stats. */
export async function getProfileStatsInputs(userId: string) {
  const [logs, taskCounts, events] = await Promise.all([
    prisma.goalLog.findMany({
      where: { userId },
      select: { durationMinutes: true, loggedAt: true },
    }),
    prisma.task.groupBy({
      by: ["status"],
      where: { userId, parentTaskId: null },
      _count: { _all: true },
    }),
    prisma.event.findMany({
      where: { userId, eventType: "task_completed" },
      select: { timestamp: true },
    }),
  ]);

  return { logs, taskCounts, events };
}
