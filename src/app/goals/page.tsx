import Link from "next/link";
import { AppShell, Bar, Pill } from "@/components/ui";
import { requirePersona } from "@/lib/guards";
import { PATHS } from "@/lib/flow";
import { weeklyProgress } from "@/lib/goals";
import { faMinutes, faNum, faPercent } from "@/lib/fa";

export const metadata = { title: "اهداف | برنامه‌ریز" };

/**
 * لیست اهداف (/goals) — مطابق مرجع طراحی.
 */
export default async function GoalsListPage() {
  const user = await requirePersona();
  const progress = await weeklyProgress(user.id);

  return (
    <AppShell
      title="اهداف من"
      action={
        <Link href={PATHS.goalsNew} className="text-accent">
          جدید
        </Link>
      }
    >
      <p className="mb-4 mt-4 text-[13px] text-muted">
        {faNum(progress.length)} هدف فعال
      </p>

      <div className="flex flex-col gap-3 pb-10">
        {progress.map((goal) => {
          const ratioPct = Math.round(goal.ratio * 100);
          const doneDays = goal.doneDays;
          const targetDays = goal.targetDaysPerWeek ?? 0;

          return (
            <Link
              key={goal.goalId}
              href={`${PATHS.goals}/${goal.goalId}`}
              className="block rounded-2xl border border-line bg-surface px-4 py-4 transition hover:bg-raised"
            >
              <div className="mb-2 flex items-center justify-between">
                <b className="text-base">{goal.title}</b>
                {goal.basis === "days" && targetDays > 0 ? (
                  <span className="text-xs text-muted">
                    {faNum(doneDays)} از {faNum(targetDays)} روز
                  </span>
                ) : (
                  <Pill>{faPercent(goal.ratio)}</Pill>
                )}
              </div>

              <Bar percent={ratioPct} />

              <div className="mt-2 flex items-center justify-between text-xs text-muted">
                <span>
                  این هفته:{" "}
                  <b className="text-accent">{faMinutes(goal.doneMinutes)}</b>
                </span>
                {goal.targetMinutesPerWeek ? (
                  <span>هدف: {faMinutes(goal.targetMinutesPerWeek)}</span>
                ) : goal.targetDaysPerWeek ? (
                  <span>هدف: {faNum(goal.targetDaysPerWeek)} روز</span>
                ) : null}
              </div>
            </Link>
          );
        })}

        {progress.length === 0 && (
          <div className="mt-8 text-center text-sm text-muted">
            هنوز هدفی ندارید. از دکمه «جدید» شروع کنید.
          </div>
        )}
      </div>

      <Link
        href={PATHS.goalsNew}
        className="fixed bottom-20 left-4 grid size-11 place-items-center rounded-full bg-accent text-2xl font-bold text-ink shadow-lg"
      >
        +
      </Link>
    </AppShell>
  );
}
