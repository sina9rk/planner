"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { track } from "@/lib/track";
import { PATHS } from "@/lib/flow";
import { currentUserId } from "@/lib/guards";
import {
  findOwnedTaskSummary,
  setTaskStatus,
  updateTaskCompletion,
} from "@/services/tasks";

const toggleTaskSchema = z.object({
  taskId: z.string().min(1),
  redirectTo: z.string().optional(),
});

const completeWithLogSchema = z.object({
  taskId: z.string().min(1),
  durationMinutes: z.coerce
    .number()
    .int("عدد صحیح وارد کن.")
    .min(1, "حداقل یک دقیقه.")
    .max(1440, "بیشتر از یک روز نمی‌شود."),
  note: z.string().trim().max(200, "یادداشت خیلی بلند است.").optional(),
  redirectTo: z.string().optional(),
});

export async function toggleTaskAction(formData: FormData) {
  const userId = await currentUserId();
  if (!userId) redirect(PATHS.login);

  const parsed = toggleTaskSchema.safeParse({
    taskId: formData.get("taskId"),
    redirectTo: formData.get("redirectTo")?.toString(),
  });

  if (!parsed.success) {
    const redirectTo = formData.get("redirectTo")?.toString() || PATHS.dashboard;
    redirect(redirectTo);
  }

  const { taskId, redirectTo: r } = parsed.data;

  const task = await findOwnedTaskSummary(taskId, userId);

  if (!task) {
    redirect(r || PATHS.dashboard);
  }

  if (task.status === "COMPLETED") {
    redirect(r || `${PATHS.goals}/${task.goalId || ""}`);
  }

  await setTaskStatus(task.id, "COMPLETED", new Date());

  await track(
    userId,
    "task_completed",
    {
      taskTitle: task.title,
      goalId: task.goalId,
      hasDurationLog: false,
    },
    task.id,
    task.goalId || undefined,
  );

  const redirectPath = r || (task.goalId ? `${PATHS.goals}/${task.goalId}` : PATHS.tasks);
  revalidatePath(redirectPath);
  if (task.goalId) {
    revalidatePath(`${PATHS.goals}/${task.goalId}`);
    revalidatePath(PATHS.goals);
  }
  revalidatePath(PATHS.tasks);
  redirect(redirectPath);
}

export async function completeTaskWithLogAction(formData: FormData) {
  const userId = await currentUserId();
  if (!userId) redirect(PATHS.login);

  const parsed = completeWithLogSchema.safeParse({
    taskId: formData.get("taskId"),
    durationMinutes: formData.get("durationMinutes"),
    note: formData.get("note") ?? undefined,
    redirectTo: formData.get("redirectTo")?.toString(),
  });

  if (!parsed.success) {
    const redirectTo = formData.get("redirectTo")?.toString() || PATHS.dashboard;
    redirect(redirectTo);
  }

  const { taskId, durationMinutes, note, redirectTo: r } = parsed.data;

  const task = await findOwnedTaskSummary(taskId, userId);

  if (!task) {
    redirect(r || PATHS.dashboard);
  }

  await updateTaskCompletion({
    taskId: task.id,
    userId,
    completed: true,
    goalId: task.goalId,
    durationMinutes,
    note: note || null,
  });

  if (task.goalId) {
    await track(
      userId,
      "goal_logged",
      {
        goalId: task.goalId,
        taskId: task.id,
        taskTitle: task.title,
        durationMinutes,
        hasNote: Boolean(note),
      },
      task.id,
      task.goalId,
    );
  }

  await track(
    userId,
    "task_completed",
    {
      taskTitle: task.title,
      goalId: task.goalId,
      hasDurationLog: Boolean(task.goalId),
      durationMinutes,
    },
    task.id,
    task.goalId || undefined,
  );

  const redirectPath = r || (task.goalId ? `${PATHS.goals}/${task.goalId}` : PATHS.tasks);
  revalidatePath(redirectPath);
  if (task.goalId) {
    revalidatePath(`${PATHS.goals}/${task.goalId}`);
    revalidatePath(PATHS.goals);
  }
  revalidatePath(PATHS.tasks);
  redirect(redirectPath);
}
