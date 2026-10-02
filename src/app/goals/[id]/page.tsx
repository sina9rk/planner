import { notFound } from "next/navigation";
import { requirePersona } from "@/lib/guards";
import { prisma } from "@/lib/prisma";
import { GoalDetailClient } from "./goal-detail-client";

export const metadata = { title: "جزئیات هدف | برنامه‌ریز" };

export default async function GoalDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requirePersona();

  const goal = await prisma.goal.findFirst({
    where: { id, userId: user.id },
    include: {
      logs: {
        orderBy: { loggedAt: "desc" },
        take: 200,
      },
      tasks: {
        orderBy: { createdAt: "asc" },
        include: {
          subTasks: {
            orderBy: { createdAt: "asc" },
          },
        },
      },
    },
  });

  if (!goal) notFound();

  const since = new Date();
  since.setDate(since.getDate() - 7);
  const logsThisWeek = goal.logs.filter((l) => l.loggedAt >= since);
  const doneMinutesWeek = logsThisWeek.reduce((s, l) => s + l.durationMinutes, 0);
  const doneDaysWeek = new Set(logsThisWeek.map((l) => l.loggedAt.toDateString())).size;

  let ratio = 0;
  if (goal.targetMinutesPerWeek && goal.targetMinutesPerWeek > 0) {
    ratio = Math.min(1, doneMinutesWeek / goal.targetMinutesPerWeek);
  } else if (goal.targetDaysPerWeek && goal.targetDaysPerWeek > 0) {
    ratio = Math.min(1, doneDaysWeek / goal.targetDaysPerWeek);
  }

  return (
    <GoalDetailClient
      goal={{
        id: goal.id,
        title: goal.title,
        horizon: goal.horizon,
        targetEndDate: goal.targetEndDate,
        targetMinutesPerWeek: goal.targetMinutesPerWeek,
        targetDaysPerWeek: goal.targetDaysPerWeek,
        reminderTime: goal.reminderTime,
      }}
      doneMinutesWeek={doneMinutesWeek}
      doneDaysWeek={doneDaysWeek}
      ratio={ratio}
      tasks={goal.tasks.map((t) => ({
        id: t.id,
        title: t.title,
        status: t.status as "PENDING" | "IN_PROGRESS" | "COMPLETED" | "ARCHIVED",
        parentTaskId: t.parentTaskId,
        subTasks: [],
      }))}
      logs={goal.logs.map((l) => ({
        id: l.id,
        durationMinutes: l.durationMinutes,
        note: l.note,
        loggedAt: l.loggedAt,
        taskId: l.taskId,
      }))}
    />
  );
}
