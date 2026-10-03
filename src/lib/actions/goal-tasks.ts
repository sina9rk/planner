"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { track } from "@/lib/track";
import { PATHS } from "@/lib/flow";
import { currentUserId } from "@/lib/guards";

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

  const task = await prisma.task.findFirst({
    where: { id: taskId, userId },
    select: { id: true, title: true, goalId: true, status: true },
  });

  if (!task) {
    if (redirectTo) redirect(redirectTo);
    redirect(PATHS.dashboard);
  }

  const isCompleting = task.status !== "COMPLETED";
  const nextStatus = isCompleting ? "COMPLETED" : "PENDING";
  const duration = durationMinutes ?? 0;

  await prisma.$transaction(async (tx) => {
    await tx.task.update({
      where: { id: task.id },
      data: {
        status: nextStatus,
        completedAt: isCompleting ? new Date() : null,
      },
    });

    if (isCompleting && task.goalId && duration > 0) {
      await tx.goalLog.create({
        data: {
          goalId: task.goalId,
          userId,
          taskId: task.id,
          durationMinutes: duration,
          note: null,
        },
      });
    }
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

  const goal = await prisma.goal.findFirst({
    where: { id: goalId, userId },
    select: { id: true },
  });

  if (!goal) {
    if (redirectTo) redirect(redirectTo);
    redirect(PATHS.goals);
  }

  await prisma.task.create({
    data: {
      userId,
      goalId: goal.id,
      title,
    },
  });

  const rPath = redirectTo || `${PATHS.goals}/${goal.id}`;
  revalidatePath(rPath);
  revalidatePath(PATHS.goals);
  revalidatePath(PATHS.tasks);
  redirect(rPath);
}
