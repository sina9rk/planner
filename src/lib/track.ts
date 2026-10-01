import { prisma } from "@/lib/prisma";

/**
 * ثبت رویداد. این جدول مهم‌ترین جدول پروژه است: فقط اضافه می‌شود و هرگز
 * update یا delete نمی‌شود. بعداً همین داده قرار است مبنای تحلیل رفتار و
 * خوشه‌بندی کاربر باشد، پس هر اکشن کاربر باید اینجا ثبت شود — حتی اگر
 * خودِ اکشن شکست خورده باشد.
 *
 * نکته‌ی مهم: track هرگز نباید اپ را خراب کند. اگر ثبت رویداد fail شود،
 * خطا فقط لاگ می‌شود و عملیات اصلی ادامه پیدا می‌کند. به همین دلیل این تابع
 * هیچ‌وقت throw نمی‌کند و برای همین هم await کردنش اختیاری است.
 *
 * درباره‌ی کاربر ناشناس: برای رویدادهای قبل از ورود (مثلاً باز کردن صفحهٔ
 * ورود) هنوز userId نداریم. این تابع با userId خالی چیزی ثبت نمی‌کند؛
 * اگر خواستی چنین رویدادهایی ثبت شوند، به یک جدول جدا یا فیلد nullable در
 * Event نیاز داریم که در schema نیست.
 */
export async function track(
  userId: string,
  eventType: string,
  metadata?: Record<string, unknown>,
  taskId?: string,
  goalId?: string,
) {
  if (!userId) return;

  try {
    await prisma.event.create({
      data: {
        userId,
        eventType,
        taskId: taskId ?? null,
        goalId: goalId ?? null,
        // Prisma با Json در TS نیاز به cast دارد چون ورودی عمومی‌تری از
        // Prisma.InputJsonValue می‌پذیرد. این cast امن است چون ما خودمان
        // metadata را می‌سازیم و مقدار بی‌serializable وارد نمی‌کنیم.
        metadata: (metadata ?? undefined) as never,
      },
    });
  } catch (err) {
    console.error("track failed:", err);
  }
}

/**
 * eventType هایی که تا الان استفاده می‌شوند. به‌جای رشتهٔ آزاد، یک union
 * می‌دهیم تا یک typo در نام رویداد (مثلاً task_completed در برابر
// task_complete) بی‌سروصدا رد نشود و تحلیل فاز بعدی را خراب نکند.
 */
export type EventType =
  | "app_opened"
  | "account_created"
  | "onboarding_started"
  | "onboarding_answered"
  | "onboarding_completed"
  | "persona_assigned"
  | "goal_created"
  | "goal_updated"
  | "goal_deleted"
  | "goal_logged"
  | "task_created"
  | "task_completed"
  | "task_postponed"
  | "task_broken_down"
  | "task_deleted"
  | "notification_opened"
  | "notification_ignored"
  | "theme_changed";

export type TrackInput = {
  eventType: EventType;
  metadata?: Record<string, unknown>;
  taskId?: string;
  goalId?: string;
};

/** برای جاهایی که آرگومان‌ها نام‌دار خواناتر از پوزیشنال است. */
export function trackAction(userId: string, input: TrackInput) {
  return track(userId, input.eventType, input.metadata, input.taskId, input.goalId);
}
