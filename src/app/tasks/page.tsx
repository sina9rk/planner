import { requirePersona } from "@/lib/guards";
import { prisma } from "@/lib/prisma";
import { TasksPageClient } from "./tasks-page-client";

export const metadata = { title: "تسک‌ها | برنامه‌ریز" };

export default async function TasksPage() {
  const user = await requirePersona();

  const tasks = await prisma.task.findMany({
    where: { userId: user.id },
    orderBy: [{ status: "asc" }, { scheduledFor: "asc" }, { createdAt: "desc" }],
    include: {
      goal: {
        select: { id: true, title: true },
      },
    },
  });

  return (
    <TasksPageClient
      tasks={tasks.map((t) => ({
        id: t.id,
        title: t.title,
        status: t.status as "PENDING" | "IN_PROGRESS" | "COMPLETED" | "ARCHIVED",
        scheduledFor: t.scheduledFor,
        deadline: t.deadline,
        goalId: t.goalId,
        goalTitle: t.goal?.title || null,
        completedAt: t.completedAt,
      }))}
    />
  );
}
