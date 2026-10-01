"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { track } from "@/lib/track";
import { PATHS } from "@/lib/flow";
import { currentUserId } from "@/lib/guards";

const logSchema = z.object({
  goalId: z.string().min(1),
  durationMinutes: z.coerce
    .number()
    .int("عدد صحیح وارد کن.")
    .min(1, "حداقل یک دقیقه.")
    .max(1440, "بیشتر از یک روز نمی‌شود."),
  note: z.string().trim().max(200, "یادداشت خیلی بلند است.").optional(),
});

export async function addGoalLogAction(formData: FormData) {
  const userId = await currentUserId();
  if (!userId) redirect(PATHS.login);

  const parsed = logSchema.safeParse({
    goalId: formData.get("goalId"),
    durationMinutes: formData.get("durationMinutes"),
    note: formData.get("note") ?? undefined,
  });
  if (!parsed.success) redirect(PATHS.dashboard);

  const goal = await prisma.goal.findFirst({
    where: { id: parsed.data.goalId, userId },
    select: { id: true, title: true },
  });
  if (!goal) redirect(PATHS.goals);

  await prisma.goalLog.create({
    data: {
      goalId: goal.id,
      userId,
      durationMinutes: parsed.data.durationMinutes,
      note: parsed.data.note || null,
    },
  });

  await track(
    userId,
    "goal_logged",
    {
      goalTitle: goal.title,
      durationMinutes: parsed.data.durationMinutes,
      hasNote: Boolean(parsed.data.note),
    },
    undefined,
    goal.id,
  );

  revalidatePath(PATHS.goals);
  revalidatePath(`${PATHS.goals}/${goal.id}`);
  redirect(`${PATHS.goals}/${goal.id}`);
}
