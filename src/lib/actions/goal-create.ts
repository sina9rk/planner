"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { track } from "@/lib/track";
import { PATHS } from "@/lib/flow";
import { currentUserId } from "@/lib/guards";
import { findPersona } from "@/lib/personas";

const goalSchema = z
  .object({
    title: z.string().trim().min(1, "عنوان لازم است.").max(60),
    targetMinutesPerWeek: z.coerce.number().int().min(0).max(10080).optional(),
    targetDaysPerWeek: z.coerce.number().int().min(1).max(7).optional(),
    reminderTime: z
      .string()
      .trim()
      .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "ساعت باید مثل ۰۷:۳۰ باشد.")
      .optional()
      .or(z.literal("")),
    reminderDays: z
      .string()
      .optional()
      .transform((v) => (v ? v.split(",").map((d) => Number(d)) : []))
      .pipe(z.array(z.number().int().min(0).max(6))),
  })
  .refine(
    (d) => (d.targetMinutesPerWeek ?? 0) > 0 || (d.targetDaysPerWeek ?? 0) > 0,
    { message: "حداقل یکی از هدف دقیقه یا هدف روز را پر کن." },
  );

function normalizeDays(days: number[]) {
  return [...new Set(days)].sort((a, b) => a - b);
}

export async function createGoalAction(formData: FormData) {
  const userId = await currentUserId();
  if (!userId) redirect(PATHS.login);

  const raw: Record<string, unknown> = Object.fromEntries(formData);
  raw.reminderDays = formData.getAll("reminderDays").map(String).join(",");

  const parsed = goalSchema.safeParse(raw);
  if (!parsed.success) redirect(PATHS.goalsNew);

  const data = parsed.data;
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { personaId: true } });
  const persona = await findPersona(user?.personaId);

  const goal = await prisma.goal.create({
    data: {
      userId,
      title: data.title,
      targetMinutesPerWeek: data.targetMinutesPerWeek ?? null,
      targetDaysPerWeek: data.targetDaysPerWeek ?? null,
      reminderTime: data.reminderTime || persona?.suggestedReminderTime || null,
      reminderDays: normalizeDays(data.reminderDays),
    },
  });

  await track(
    userId,
    "goal_created",
    {
      title: goal.title,
      targetMinutesPerWeek: goal.targetMinutesPerWeek,
      targetDaysPerWeek: goal.targetDaysPerWeek,
      hasReminder: Boolean(goal.reminderTime),
    },
    undefined,
    goal.id,
  );

  redirect(PATHS.goals);
}
