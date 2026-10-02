"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { track } from "@/lib/track";
import { PATHS } from "@/lib/flow";
import { currentUserId } from "@/lib/guards";

const completeTaskSchema = z.object({
  taskId: z.string().min(1),
  durationMinutes: z.coerce
    .number()
    .int("عدد صحیح وارد کن.")
    .min(0, "حداقل صفر دقیقه.")
    .max(1440, "بیشتر از یک روز نمی‌شود.")
    .optional(),
  note: z.string().trim().max(200, "یادداشت خیلی بلند است.").optional(),
});

export async function completeTaskAction(formData: FormData) {
  const userId = await currentUserId();
  if (!userId) redirect(PATHS.login);

  const parsed = completeTaskSchema.safeParse({
    taskId: formData.get("taskId"),
    durationMinutes: formData.get("durationMinutes") ?? undefined,
    note: formData.get("note") ?? undefined,
  });

  if (!parsed.success) {
    const errorPath = formData.get("redirectTo")?.toString() || PATHS.dashboard;
    redirect(errorPath);
  }

  const { taskId, durationMinutes, note } = parsed.data;
  const duration = durationMinutes ?? 0;

  const task = await prisma.task.findFirst({
    where: { id: taskId, userId },
    select: { id: true, title: true, goalId: true, status: true },
  });

  if (!task) {
    const errorPath = formData.get("redirectTo")?.toString() || PATHS.dashboard;
    redirect(errorPath);
  }

  await prisma.$transaction(async (tx) => {
    await tx.task.update({
      where: { id: task.id },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
      },
    });

    if (task.goalId && duration > 0) {
      await tx.goalLog.create({
        data: {
          goalId: task.goalId,
          userId,
          taskId: task.id,
          durationMinutes: duration,
          note: note || null,
        },
      });
    }
  });

  if (task.goalId && duration > 0) {
    await track(
      userId,
      "goal_logged",
      {
        goalId: task.goalId,
        taskId: task.id,
        taskTitle: task.title,
        durationMinutes: duration,
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
      hasDurationLog: task.goalId && duration > 0,
      durationMinutes: duration,
    },
    task.id,
    task.goalId || undefined,
  );

  const redirectTo = formData.get("redirectTo")?.toString();
  if (redirectTo) {
    revalidatePath(redirectTo);
    redirect(redirectTo);
  }

  revalidatePath(PATHS.goals);
  revalidatePath(PATHS.tasks);
  if (task.goalId) {
    revalidatePath(`${PATHS.goals}/${task.goalId}`);
  }
  redirect(PATHS.tasks);
}

const createTaskSchema = z.object({
  title: z.string().trim().min(1, "عنوان تسک نمی‌تواند خالی باشد.").max(120),
  description: z.string().trim().max(500).optional(),
  goalId: z.string().optional().or(z.literal("")),
  scheduledFor: z.string().optional().or(z.literal("")),
  deadline: z.string().optional().or(z.literal("")),
  parentTaskId: z.string().optional().or(z.literal("")),
});

function parseDate(dateStr?: string) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? null : d;
}

export async function createTaskAction(formData: FormData) {
  const userId = await currentUserId();
  if (!userId) redirect(PATHS.login);

  const parsed = createTaskSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") ?? undefined,
    goalId: formData.get("goalId") ?? undefined,
    scheduledFor: formData.get("scheduledFor") ?? undefined,
    deadline: formData.get("deadline") ?? undefined,
    parentTaskId: formData.get("parentTaskId") ?? undefined,
  });

  if (!parsed.success) {
    const errorPath = formData.get("redirectTo")?.toString() || PATHS.tasks;
    redirect(errorPath);
  }

  const { title, description, goalId, scheduledFor, deadline, parentTaskId } = parsed.data;

  const data: {
    userId: string;
    title: string;
    description: string | null;
    scheduledFor: Date | null;
    deadline: Date | null;
    goalId?: string;
    parentTaskId?: string;
  } = {
    userId,
    title,
    description: description || null,
    scheduledFor: parseDate(scheduledFor),
    deadline: parseDate(deadline),
  };

  if (goalId) {
    const goal = await prisma.goal.findFirst({
      where: { id: goalId, userId },
      select: { id: true },
    });
    if (goal) data.goalId = goal.id;
  }

  if (parentTaskId) {
    const parent = await prisma.task.findFirst({
      where: { id: parentTaskId, userId },
      select: { id: true },
    });
    if (parent) data.parentTaskId = parent.id;
  }

  const task = await prisma.task.create({ data });

  await track(
    userId,
    "task_created",
    {
      taskTitle: task.title,
      goalId: task.goalId,
      hasParent: Boolean(task.parentTaskId),
      hasScheduled: Boolean(task.scheduledFor),
      hasDeadline: Boolean(task.deadline),
    },
    task.id,
    task.goalId || undefined,
  );

  const redirectTo = formData.get("redirectTo")?.toString();
  if (redirectTo) {
    revalidatePath(redirectTo);
    redirect(redirectTo);
  }

  revalidatePath(PATHS.tasks);
  revalidatePath(PATHS.goals);
  if (task.goalId) revalidatePath(`${PATHS.goals}/${task.goalId}`);
  redirect(PATHS.tasks);
}
