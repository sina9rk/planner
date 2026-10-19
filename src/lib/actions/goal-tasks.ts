"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { track } from "@/lib/track";
import { PATHS } from "@/lib/flow";
import { currentUserId } from "@/lib/guards";
import { createTask, findOwnedTaskSummary, updateTaskCompletion } from "@/services/tasks";
import { findOwnedGoal } from "@/services/goals";

const toggleSchema = z.object({
  taskId: z.string().min(1),
  durationMinutes: z.coerce
    .number()
    .int("عدد صحیح وارد کن.")
    .min(0, "حداقل صفر دقیقه.")
    .max(1440, "بیشتر از یک روز نمی‌شود.")
    .optional(),
  redirectTo: z.string().optional(),
});

const createSchema = z.object({
  goalId: z.string().min(1),
  title: z.string().trim().min(1, "عنوان تسک نمی‌تواند خالی باشد.").max(120),
  redirectTo: z.string().optional(),
});

export async function toggleGoalTaskAction(formData: FormData) {
  const userId = await currentUserId();
  if (!userId) redirect(PATHS.login);

  const parsed = toggleSchema.safeParse({
    taskId: formData.get("taskId"),
    durationMinutes: formData.get("durationMinutes") ?? undefined,
    redirectTo: formData.get("redirectTo")?.toString(),
  });

  if (!parsed.success) {
    const r = formData.get("redirectTo")?.toString();
    if (r) redirect(r);
    redirect(PATHS.dashboard);
  }

  const { taskId, durationMinutes, redirectTo } = parsed.data;

  const task = await findOwnedTaskSummary(taskId, userId);

  if (!task) {
    if (redirectTo) redirect(redirectTo);
    redirect(PATHS.dashboard);
  }

  const isCompleting = task.status !== "COMPLETED";
  const duration = durationMinutes ?? 0;

  await updateTaskCompletion({
    taskId: task.id,
    userId,
    completed: isCompleting,
    goalId: task.goalId,
    durationMinutes: duration,
  });

  if (isCompleting) {
    if (task.goalId && duration > 0) {
      await track(
        userId,
        "goal_logged",
        {
          goalId: task.goalId,
          taskId: task.id,
          taskTitle: task.title,
          durationMinutes: duration,
        },
        task.id,
        task.goalId
      );
    }
    await track(
      userId,
      "task_completed",
      {
        taskTitle: task.title,
        goalId: task.goalId,
        hasDurationLog: Boolean(task.goalId && duration > 0),
        durationMinutes: duration,
      },
      task.id,
      task.goalId || undefined
    );
  }

  const rPath = redirectTo || (task.goalId ? `${PATHS.goals}/${task.goalId}` : PATHS.tasks);
  if (task.goalId) {
    revalidatePath(`${PATHS.goals}/${task.goalId}`);
    revalidatePath(PATHS.goals);
  }
  revalidatePath(PATHS.tasks);
  redirect(rPath);
}

export async function createGoalTaskAction(formData: FormData) {
  const userId = await currentUserId();
  if (!userId) redirect(PATHS.login);

  const parsed = createSchema.safeParse({
    goalId: formData.get("goalId"),
    title: formData.get("title"),
    redirectTo: formData.get("redirectTo")?.toString(),
  });

  if (!parsed.success) {
    const r = formData.get("redirectTo")?.toString();
    if (r) redirect(r);
    redirect(PATHS.dashboard);
  }

  const { goalId, title, redirectTo } = parsed.data;

  const goal = await findOwnedGoal(goalId, userId);

  if (!goal) {
    if (redirectTo) redirect(redirectTo);
    redirect(PATHS.goals);
  }

  await createTask({
    userId,
    goalId: goal.id,
    title,
    description: null,
    scheduledFor: null,
    deadline: null,
  });

  const rPath = redirectTo || `${PATHS.goals}/${goal.id}`;
  revalidatePath(rPath);
  revalidatePath(PATHS.goals);
  revalidatePath(PATHS.tasks);
  redirect(rPath);
}
