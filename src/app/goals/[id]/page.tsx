import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/ui";
import { requirePersona } from "@/lib/guards";
import { PATHS } from "@/lib/flow";
import { prisma } from "@/lib/prisma";
import { faClock, faMinutes, faNum, faPercent, faRelativeDate } from "@/lib/fa";
import { AddLogForm } from "../add-log-form";

export const metadata = { title: "جزئیات هدف | برنامه‌ریز" };

export default async function GoalDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requirePersona();

  const goal = await prisma.goal.findFirst({
    where: { id, userId: user.id },
    include: {
      logs: {
        orderBy: { loggedAt: "desc" },
        take: 100,
      },
    },
  });
  if (!goal) notFound();

  const since = new Date();
  since.setDate(since.getDate() - 7);
  const logsThisWeek = goal.logs.filter((l) => l.loggedAt >= since);
  const doneMinutesWeek = logsThisWeek.reduce((s, l) => s + l.durationMinutes, 0);
  const doneDaysWeek = new Set(logsThisWeek.map((l) => l.loggedAt.toDateString())).size;

  let ratio = 0;
  if (goal.targetMinutesPerWeek && goal.targetMinutesPerWeek > 0) {
    ratio = Math.min(1, doneMinutesWeek / goal.targetMinutesPerWeek);
  } else if (goal.targetDaysPerWeek && goal.targetDaysPerWeek > 0) {
    ratio = Math.min(1, doneDaysWeek / goal.targetDaysPerWeek);
  }

  return (
    <AppShell title={goal.title}>
      <Link href={PATHS.goals} className="mb-3 text-xs text-muted">
        ← بازگشت
      </Link>
      <p className="mb-4 text-xs text-muted">
        هدف هفتگی:{" "}
        {goal.targetMinutesPerWeek
          ? faMinutes(goal.targetMinutesPerWeek)
          : goal.targetDaysPerWeek
          ? `${faNum(goal.targetDaysPerWeek)} روز`
          : "—"}
        {goal.reminderTime ? ` · یادآوری ساعت ${goal.reminderTime}` : ""}
      </p>

      <div className="mb-4 grid grid-cols-3 gap-2">
        <div className="rounded-xl border border-line bg-surface p-3 text-center">
          <b className="block text-lg text-accent">{faMinutes(doneMinutesWeek)}</b>
          <span className="text-[11px] text-muted">این هفته</span>
        </div>
        <div className="rounded-xl border border-line bg-surface p-3 text-center">
          <b className="block text-lg text-accent">{faNum(doneDaysWeek)}</b>
          <span className="text-[11px] text-muted">روز فعال</span>
        </div>
        <div className="rounded-xl border border-line bg-surface p-3 text-center">
          <b className="block text-lg text-accent">{faPercent(ratio)}</b>
          <span className="text-[11px] text-muted">از هدف</span>
        </div>
      </div>

      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-sm font-medium text-muted">ثبت کار امروز</h2>
        <Link href={`${PATHS.goals}/${goal.id}/advisor`} className="text-xs text-accent">
          مشاور AI
        </Link>
      </div>
      <AddLogForm goalId={goal.id} />

      <h2 className="mt-6 mb-2 text-sm font-medium text-muted">تاریخچه</h2>
      <div className="space-y-2 pb-8">
        {goal.logs.map((log) => (
          <div key={log.id} className="flex items-start gap-3 border-b border-line py-3 last:border-0">
            <div className="mt-2 size-2 shrink-0 rounded-full bg-accent" />
            <div>
              <b className="block">{faMinutes(log.durationMinutes)}</b>
              <span className="text-xs text-muted">
                {log.note || "—"} · {faRelativeDate(log.loggedAt)} · {faClock(log.loggedAt)}
              </span>
            </div>
          </div>
        ))}
        {goal.logs.length === 0 && (
          <p className="py-4 text-center text-xs text-muted">هنوز لاگی ثبت نشده</p>
        )}
      </div>
    </AppShell>
  );
}
