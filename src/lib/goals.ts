import { prisma } from "@/lib/prisma";

/**
 * محاسبهٔ پیشرفت هفتگی اهداف.
 *
 * داشبورد هفتگی (مرحلهٔ ۶) و کارت هر هدف در فهرست، هر دو به همین محاسبه تکیه
 * می‌کنند. عمداً یک جا نوشته شده: اگر داشبورد درصد را یک‌جور حساب کند و کارت
 * هدف جور دیگر، کاربر دو عدد متفاوت برای یک چیز می‌بیند.
 */

export type GoalProgress = {
  goalId: string;
  title: string;
  targetMinutesPerWeek: number | null;
  targetDaysPerWeek: number | null;
  doneMinutes: number;
  doneDays: number;
  /** ۰ تا ۱؛ برای نوار پیشرفت. */
  ratio: number;
  /** کدام معیار مبنا بوده: دقیقه یا روز. */
  basis: "minutes" | "days" | "none";
};

/** شروع هفتهٔ جاری، شنبه. هفته در ایپ از شنبه شروع می‌شود نه دوشنبه. */
export function startOfWeek(now = new Date()): Date {
  const date = new Date(now);
  date.setHours(0, 0, 0, 0);
  // getDay: 0=یکشنبه ... 6=شنبه. برای شنبه باید 1 روز عقب برویم.
  const shift = (date.getDay() + 1) % 7;
  date.setDate(date.getDate() - shift);
  return date;
}

/** تعداد روزهایی که در هفتهٔ جاری روی یک هدف لاگ دارد. */
export function countDistinctDays(loggedAt: Date[]): number {
  const days = new Set<string>();
  for (const date of loggedAt) {
    days.add(
      `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`,
    );
  }
  return days.size;
}

/**
 * نرخ پیشرفت یک هدف از روی لاگ‌های هفته.
 *
 * اگر هر دو هدف (دقیقه و روز) داده شده باشند، دقیقه مبنا می‌شود چون سخت‌گیرانه‌تر
 * است: ۷ روز کارِ خیلی کوتاه می‌تواند هدف دقیقه را رد کند ولی هدف روز را نه.
 * اگر هیچ‌کدام نباشد (کاربر هدف را فقط عنوان زده) ratio صفر است و بنر
 * پیشرفت نمایش داده نمی‌شود.
 */
export function progressOf(input: {
  targetMinutesPerWeek: number | null;
  targetDaysPerWeek: number | null;
  doneMinutes: number;
  doneDays: number;
}): Pick<GoalProgress, "ratio" | "basis"> {
  const minutesTarget = input.targetMinutesPerWeek ?? 0;
  const daysTarget = input.targetDaysPerWeek ?? 0;

  if (minutesTarget > 0) {
    return {
      ratio: Math.min(1, input.doneMinutes / minutesTarget),
      basis: "minutes",
    };
  }
  if (daysTarget > 0) {
    return {
      ratio: Math.min(1, input.doneDays / daysTarget),
      basis: "days",
    };
  }
  return { ratio: 0, basis: "none" };
}

/**
 * پیشرفت همهٔ اهداف فعال کاربر در هفتهٔ جاری، با یک کوئری.
 *
 * لاگ‌ها داخل بازهٔ هفته فیلتر می‌شوند نه بیرون از آن تا دیتابیس کمتر داده
 * بفرستد؛ برای کاربری که ماه‌ها لاگ دارد این تفاوت محسوس است.
 */
export async function weeklyProgress(
  userId: string,
  now = new Date(),
): Promise<GoalProgress[]> {
  const since = startOfWeek(now);

  const goals = await prisma.goal.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
    include: {
      logs: {
        where: { loggedAt: { gte: since } },
        select: { durationMinutes: true, loggedAt: true },
      },
    },
  });

  return goals.map((goal) => {
    const doneMinutes = goal.logs.reduce(
      (sum, log) => sum + log.durationMinutes,
      0,
    );
    const doneDays = countDistinctDays(goal.logs.map((log) => log.loggedAt));
    const { ratio, basis } = progressOf({
      targetMinutesPerWeek: goal.targetMinutesPerWeek,
      targetDaysPerWeek: goal.targetDaysPerWeek,
      doneMinutes,
      doneDays,
    });

    return {
      goalId: goal.id,
      title: goal.title,
      targetMinutesPerWeek: goal.targetMinutesPerWeek,
      targetDaysPerWeek: goal.targetDaysPerWeek,
      doneMinutes,
      doneDays,
      ratio,
      basis,
    };
  });
}

/**
 * جمع هفتگی همهٔ اهداف، برای کارت‌های آمار داشبورد و پروفایل.
 */
export async function weeklyTotals(
  userId: string,
  now = new Date(),
): Promise<{ doneMinutes: number; doneDays: number; activeGoals: number }> {
  const rows = await weeklyProgress(userId, now);
  const logs = await prisma.goalLog.findMany({
    where: { userId, loggedAt: { gte: startOfWeek(now) } },
    select: { loggedAt: true },
  });

  return {
    doneMinutes: rows.reduce((sum, row) => sum + row.doneMinutes, 0),
    doneDays: countDistinctDays(logs.map((log) => log.loggedAt)),
    activeGoals: rows.length,
  };
}
