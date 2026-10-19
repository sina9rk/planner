import { requirePersona } from "@/lib/guards";
import { listTasksForUser } from "@/services/tasks";
import { TasksPageClient } from "./tasks-page-client";

export const metadata = { title: "تسک‌ها | برنامه‌ریز" };

export default async function TasksPage() {
  const user = await requirePersona();

  const tasks = await listTasksForUser(user.id);

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
