import { prisma } from "@/lib/prisma";
import { findPersona, scoreBreakdown, type OnboardingAnswer } from "@/lib/personas";

/**
 * آمار پروفایل (مرحلهٔ ۷). همه از داده‌های واقعی محاسبه می‌شوند، نه عدد
 * ساختگی: Event و GoalLog برای همین تحلیل ساخته شده‌اند.
 *
 * «درصد تکمیل» از نسبت تسک‌های تمام‌شده به کل تسک‌ها می‌آید. «روز فعال» از
 * روزهایی که در آن‌ها یا روی هدفی کار شده یا تسکی تکمیل شده.
 */

export type ProfileStats = {
  activeDays: number;
  completionRate: number;
  totalMinutes: number;
  loggedDays: number;
  traitBars: { label: string; left: string; right: string; ratio: number }[];
};

/** پاسخ‌های ذخیره‌شدهٔ کاربر را به شکل معتبر درمی‌آورد. */
export function parseAnswers(value: unknown): OnboardingAnswer[] {
  if (!Array.isArray(value)) return [];

  const answers: OnboardingAnswer[] = [];
  for (const item of value) {
    if (typeof item !== "object" || item === null) continue;
    const record = item as Record<string, unknown>;
    if (typeof record.questionId !== "string") continue;
    if (typeof record.optionIndex !== "number") continue;
    answers.push({
      questionId: record.questionId,
      optionIndex: record.optionIndex,
    });
  }
  return answers;
}

/**
 * نوارهای محور ویژگی. برخلاف personaId، این‌ها از پرسشنامه می‌آیند نه از
 * رفتار واقعی؛ بریف می‌گوید با گذشت زمان باید از رفتار واقعی اصلاح شوند که
 * فاز بعدی است.
 *
 * محور سوم «صبح‌کار/شب‌کار» از traitAxis پرسونا می‌آید، ولی چون مقدار
 * suggestedReminderTime دقیق‌تر است، همان مبنا قرار می‌گیرد.
 */
function traitBars(
  breakdown: Record<string, number> | null,
): ProfileStats["traitBars"] {
  const bars: ProfileStats["traitBars"] = [];

  // محور تک‌تمرکز/چندتمرکز و ساختارمند/خودجوش از میانگین وزن پرسوناهای
  // افراطی در آن محور می‌آید. breakdown نسبی است و همیشه یکی از آن‌ها ۱ است.
  if (breakdown) {
    const ids = Object.keys(breakdown);
    const focusScore =
      ids
        .filter((id) => id === "focused_structured" || id === "steady_persistent")
        .reduce((sum, id) => sum + (breakdown[id] ?? 0), 0) /
      Math.max(1, (breakdown.focused_structured ?? 0) > 0 || (breakdown.steady_persistent ?? 0) > 0 ? 1 : 1);
    const structureScore = ids
      .filter((id) => id === "metrics_driven" || id === "deadline_driven")
      .reduce((sum, id) => sum + (breakdown[id] ?? 0), 0);

    bars.push({
      label: "ساختارمند",
      left: "ساختارمند",
      right: "خودجوش",
      ratio: structureScore,
    });
    bars.push({
      label: "تحلیلی",
      left: "تحلیلی",
      right: "شهودی",
      ratio: Math.min(1, focusScore),
    });
  }

  return bars;
}

export async function profileStats(
  userId: string,
  personaId: string | null,
  rawAnswers: unknown,
): Promise<ProfileStats> {
  // since فعلاً استفاده نمی‌شود؛ آمار کلی پروفایل در فاز بعد دقیق‌تر خواهد شد.
  // const since = startOfWeek(new Date(Date.now() - 30 * 86400000));

  const [logs, taskCounts, goalLogs] = await Promise.all([
    prisma.goalLog.findMany({
      where: { userId },
      select: { durationMinutes: true, loggedAt: true },
    }),
    prisma.task.groupBy({
      by: ["status"],
      where: { userId, parentTaskId: null },
      _count: { _all: true },
    }),
    prisma.event.findMany({
      where: { userId, eventType: "task_completed" },
      select: { timestamp: true },
    }),
  ]);

  const totalMinutes = logs.reduce((sum, log) => sum + log.durationMinutes, 0);

  // روزهای فعال: روزهایی که روی هدف کار شده یا تسکی تمام شده.
  const activeDayKeys = new Set<string>();
  for (const log of logs) {
    activeDayKeys.add(dayKey(log.loggedAt));
  }
  for (const event of goalLogs) {
    activeDayKeys.add(dayKey(event.timestamp));
  }

  const totalTasks = taskCounts.reduce((sum, row) => sum + row._count._all, 0);
  const completedTasks =
    taskCounts.find((row) => row.status === "COMPLETED")?._count._all ?? 0;

  const persona = await findPersona(personaId);
  const breakdown = await scoreBreakdown(parseAnswers(rawAnswers));

  const bars = traitBars(breakdown);

  // محور صبح‌کار/شب‌کار از ساعت یادآوری پیشنهادی پرسونا می‌آید: قبل از ۱۲
  // صبح‌کار، بعد از آن شب‌کار.
  if (persona?.suggestedReminderTime) {
    const hour = Number(persona.suggestedReminderTime.split(":")[0] ?? 12);
    bars.push({
      label: "زمان",
      left: "صبح‌کار",
      right: "شب‌کار",
      ratio: Math.min(1, Math.max(0, hour / 23)),
    });
  }

  return {
    activeDays: activeDayKeys.size,
    completionRate: totalTasks > 0 ? completedTasks / totalTasks : 0,
    totalMinutes,
    loggedDays: logs.length,
    traitBars: bars,
  };
}

function dayKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}
