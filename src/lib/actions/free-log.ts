"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { track } from "@/lib/track";
import { PATHS } from "@/lib/flow";
import { currentUserId } from "@/lib/guards";

const freeLogSchema = z.object({
  goalId: z.string().min(1),
  durationMinutes: z.coerce
    .number()
    .int("عدد صحیح وارد کن.")
    .min(1, "حداقل یک دقیقه.")
    .max(1440, "بیشتر از یک روز نمی‌شود."),
  note: z.string().trim().max(200, "یادداشت خیلی بلند است.").optional(),
});

export async function addFreeGoalLogAction(formData: FormData) {
  const userId = await currentUserId();
  if (!userId) redirect(PATHS.login);

  const parsed = freeLogSchema.safeParse({
    goalId: formData.get("goalId"),
    durationMinutes: formData.get("durationMinutes"),
    note: formData.get("note") ?? undefined,
  });

  if (!parsed.success) {
    const goalId = formData.get("goalId")?.toString();
    if (goalId) redirect(`${PATHS.goals}/${goalId}`);
    redirect(PATHS.goals);
  }

  const { goalId, durationMinutes, note } = parsed.data;

  const goal = await prisma.goal.findFirst({
    where: { id: goalId, userId },
    select: { id: true, title: true },
  });

  if (!goal) redirect(PATHS.goals);

  await prisma.goalLog.create({
    data: {
      goalId: goal.id,
      userId,
      taskId: null,
      durationMinutes,
      note: note || null,
    },
  });

  await track(
    userId,
    "goal_logged",
    {
      goalTitle: goal.title,
      durationMinutes,
      hasNote: Boolean(note),
      taskId: null,
    },
    undefined,
    goal.id,
  );

  revalidatePath(PATHS.goals);
  revalidatePath(`${PATHS.goals}/${goal.id}`);
  redirect(`${PATHS.goals}/${goal.id}`);
}
