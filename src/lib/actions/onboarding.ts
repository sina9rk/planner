"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { track } from "@/lib/track";
import { PATHS } from "@/lib/flow";
import { currentUserId } from "@/lib/guards";
import {
  readQuestions,
  scorePersona,
  type OnboardingAnswer,
} from "@/lib/personas";
import { parseAnswers } from "@/lib/stats";

/**
 * آنبوردینگ (مرحلهٔ ۱) و تعیین پرسونا (مرحلهٔ ۲).
 *
 * وضعیت پیشرفت کاربر در `User.onboardingAnswers` نگه داشته می‌شود، نه در کوکی.
 * دلیلش این است که هر پاسخ باید در جدول Event ثبت شود و Event به userId نیاز
 * دارد؛ با کوکی، پاسخ‌ها تا پایان هیچ‌جا ثبت نمی‌شدند و اگر کاربر وسط کار
 * کوکی‌اش پاک می‌شد (یا روی دستگاه دیگری ادامه می‌داد) همه‌چیز از دست می‌رفت.
 *
 * اکشن‌ها به‌جای برگرداندن state، بعد از هر تغییر revalidate می‌کنند. دلیلش
 * این است که وضعیت از دیتابیس خوانده می‌شود، پس به‌روزرسانی کش همان کار را
 * می‌کند که setState محلی، ولی یک منبع حقیقت دارد.
 */

const answerSchema = z.object({
  questionId: z.string().min(1),
  optionIndex: z.coerce.number().int().min(0),
});

export async function answerQuestionAction(formData: FormData) {
  const userId = await currentUserId();
  if (!userId) redirect(PATHS.login);

  const parsed = answerSchema.safeParse({
    questionId: formData.get("questionId"),
    optionIndex: formData.get("optionIndex"),
  });

  if (!parsed.success) redirect(PATHS.onboarding);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { onboardingAnswers: true },
  });
  if (!user) redirect(PATHS.login);

  const answers = parseAnswers(user.onboardingAnswers);

  // سؤالی که فرم فرستاده باید واقعاً در پیکربندی باشد. بدون این چک، یک درخواست
  // دستکاری‌شده می‌توانست وزن‌های دلخواه به امتیاز خودش تزریق کند، چون محاسبهٔ
  // پرسونا بعداً به همین آرایه اعتماد می‌کند.
  const questions = await readQuestions();
  const question = questions.find((q) => q.id === parsed.data.questionId);
  if (!question) redirect(PATHS.onboarding);
  if (!question.options[parsed.data.optionIndex]) redirect(PATHS.onboarding);

  // پاسخ دوباره به همان سؤال، پاسخ قبلی را جایگزین می‌کند. اگر به‌جای جایگزینی
  // append می‌کردیم، کاربری که یک سؤال را عوض می‌کرد دو پاسخ برای آن سؤال
  // می‌داشت و امتیازش دوبل می‌شد.
  const next: OnboardingAnswer[] = [
    ...answers.filter((a) => a.questionId !== parsed.data.questionId),
    { questionId: parsed.data.questionId, optionIndex: parsed.data.optionIndex },
  ].sort((a, b) => {
    const orderA = questions.find((q) => q.id === a.questionId)?.order ?? 0;
    const orderB = questions.find((q) => q.id === b.questionId)?.order ?? 0;
    return orderA - orderB;
  });

  await prisma.user.update({
    where: { id: userId },
    data: { onboardingAnswers: next as never },
  });

  await track(userId, "onboarding_answered", {
    questionId: question.id,
    order: question.order,
    optionIndex: parsed.data.optionIndex,
    answered: next.length,
    total: questions.length,
  });

  // پرسشنامه تمام شد: پرسونا را همین‌جا حساب و ذخیره می‌کنیم. جدا کردنش به یک
  // صفحهٔ دیگر یعنی کاربر می‌توانست با پرسشنامهٔ نیمه‌تمام به نتیجه برسد.
  //
  // معیار پایان، تعداد سؤال‌های فایل پیکربندی است نه next.length: پاسخ‌هایی که
  // به سؤال حذف‌شده مربوط‌اند در next می‌مانند ولی هیچ‌وقت پرسشنامه را کامل
  // نمی‌کنند، پس با معیار next.length کاربر در حلقهٔ بی‌پایان گیر می‌کرد.
  if (next.length >= questions.length) {
    const persona = await scorePersona(next);
    if (persona) {
      await prisma.user.update({
        where: { id: userId },
        data: { personaId: persona.id },
      });
      await track(userId, "persona_assigned", {
        personaId: persona.id,
        toneStyle: persona.toneStyle,
      });
      revalidatePath(PATHS.onboarding);
      redirect(PATHS.persona);
    }
  }

  revalidatePath(PATHS.onboarding);
}

/**
 * شروع از اول: پاسخ‌ها و پرسونا پاک می‌شوند تا کاربر دوباره سؤال‌ها را ببیند.
 *
 * پاک‌کردن JSON با `Prisma.DbNull` انجام می‌شود نه `undefined`: در Prisma مقدار
 * `undefined` یعنی «این ستون را در آپدیت نگذار»، نه «null کن». با undefined پاسخ‌های
 * قبلی می‌ماندند و کاربر عملاً دوباره سؤال‌ها را نمی‌دید.
 */
export async function restartOnboardingAction() {
  const userId = await currentUserId();
  if (!userId) redirect(PATHS.login);

  await prisma.user.update({
    where: { id: userId },
    data: { onboardingAnswers: Prisma.DbNull, personaId: null },
  });

  await track(userId, "onboarding_reset", {});

  revalidatePath(PATHS.profile);
  revalidatePath(PATHS.onboarding);
  redirect(PATHS.onboarding);
}
