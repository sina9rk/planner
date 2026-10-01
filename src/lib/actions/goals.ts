"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { track } from "@/lib/track";
import { PATHS } from "@/lib/flow";
import { currentUserId } from "@/lib/guards";
import { findPersona } from "@/lib/personas";

/**
 * اهداف و لاگ‌های آن‌ها (مرحلهٔ ۳).
 *
 * هر دو اکشن userId را از نشست می‌گیرند، نه از فرم. اگر userId از فرم بیاید،
 * یک کاربر می‌تواند با دستکاری درخواست به هدفِ کاربر دیگری لاگ بزند یا هدفش را
 * حذف کند — این کلاس از باگ با یک کوئری مالکیت در هر اکشن بسته می‌شود.
 */

const MAX_TITLE = 60;
const MAX_NOTE = 200;

/** «۱۸:۰۰» — رشتهٔ خام دیتابیس. الگوی سخت‌گیرانه چون مستقیم به Local Notification می‌رود. */
const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

const goalSchema = z
  .object({
    title: z.string().trim().min(1, "عنوان لازم است.").max(MAX_TITLE),
    targetMinutesPerWeek: z.coerce
      .number()
      .int()
      .min(0)
      .max(10080, "حداکثر ۱۰۰۸۰ دقیقه در هفته.")
      .optional(),
    targetDaysPerWeek: z.coerce
      .number()
      .int()
      .min(1)
      .max(7)
      .optional(),
    reminderTime: z
      .string()
      .trim()
      .regex(TIME_RE, "ساعت باید مثل ۰۷:۳۰ باشد.")
      .optional()
      .or(z.literal("")),
    reminderDays: z
      .string()
      .optional()
      // ورودی checkboxها به‌صورت رشتهٔ تکراری می‌آید؛ اینجا به آرایهٔ عدد تبدیل
      // می‌شود چون Prisma برای reminderDays آرایهٔ int می‌خواهد.
      .transform((value) =>
        value === undefined || value === ""
          ? []
          : value.split(",").map((day) => Number(day)),
      )
      .pipe(z.array(z.number().int().min(0).max(6))),
  })
  .refine(
    (data) =>
      (data.targetMinutesPerWeek ?? 0) > 0 || (data.targetDaysPerWeek ?? 0) > 0,
    { message: "حداقل یکی از هدف دقیقه یا هدف روز را پر کن." },
  );

const logSchema = z.object({
  goalId: z.string().min(1),
  durationMinutes: z.coerce
    .number()
    .int("عدد صحیح وارد کن.")
    .min(1, "حداقل یک دقیقه.")
    .max(1440, "بیشتر از یک روز نمی‌شود."),
  note: z.string().trim().max(MAX_NOTE, "یادداشت خیلی بلند است.").optional(),
});

/** روزهای هفته به ترتیب، بدون تکرار. */
function normalizeDays(days: number[]): number[] {
  return [...new Set(days)].sort((a, b) => a - b);
}

export async function createGoalAction(formData: FormData) {
  const userId = await currentUserId();
  if (!userId) redirect(PATHS.login);

  const raw = Object.fromEntries(formData);
  // reminderDays چند checkbox است و Object.fromEntries فقط آخری را نگه می‌دارد،
  // پس getAll لازم است.
  raw.reminderDays = formData.getAll("reminderDays").map(String).join(",");

  const parsed = goalSchema.safeParse(raw);
  if (!parsed.success) redirect(PATHS.goalsNew);

  const data = parsed.data;

  // یک کوئری برای هر دو چیز لازم: personaId کاربر و نامی که در Event ثبت می‌شود.
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { personaId: true },
  });
  const persona = await findPersona(user?.personaId);

  const goal = await prisma.goal.create({
    data: {
      userId,
      title: data.title,
      targetMinutesPerWeek: data.targetMinutesPerWeek ?? null,
      targetDaysPerWeek: data.targetDaysPerWeek ?? null,
      // ساعت یادآوری پیش‌فرض از پرسونای کاربر می‌آید، نه از حدس ثابت: همان
      // چیزی است که در صفحهٔ نتیجه به او وعده داده شده.
      reminderTime: data.reminderTime || persona?.suggestedReminderTime || null,
      // روزها فقط وقتی ذخیره می‌شوند که کاربر انتخاب کرده باشد. آرایهٔ خالی
      // یعنی «هر روز» و در محاسبهٔ زمان‌بندی نوتیف به همین شکل تفسیر می‌شود.
      reminderDays: normalizeDays(data.reminderDays),
    },
  });

  await track(userId, "goal_created", {
    title: goal.title,
    targetMinutesPerWeek: goal.targetMinutesPerWeek,
    targetDaysPerWeek: goal.targetDaysPerWeek,
    hasReminder: Boolean(goal.reminderTime),
  }, undefined, goal.id);

  revalidatePath(PATHS.goals);
  redirect(PATHS.goals);
}

export async function deleteGoalAction(formData: FormData) {
  const userId = await currentUserId();
  if (!userId) redirect(PATHS.login);

  const goalId = String(formData.get("goalId") ?? "");
  if (!goalId) redirect(PATHS.goals);

  // شرط userId در where، همان محافظت مالکیت است: اگر goalId مال کاربر دیگری
  // باشد، count صفر می‌شود و چیزی حذف نمی‌شود.
  const { count } = await prisma.goal.deleteMany({ where: { id: goalId, userId } });

  if (count > 0) {
    await track(userId, "goal_deleted", {}, undefined, goalId);
  }

  revalidatePath(PATHS.goals);
  redirect(PATHS.goals);
}

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
