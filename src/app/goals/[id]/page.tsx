import { notFound } from "next/navigation";
import { requirePersona } from "@/lib/guards";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/ui";
import Link from "next/link";
import { PATHS } from "@/lib/flow";
import { faMinutes, faNum, faPercent, faRelativeDate } from "@/lib/fa";
import { GoalTabs } from "./goal-tabs";

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
        take: 200,
      },
      tasks: {
        orderBy: { createdAt: "asc" },
        include: {
          subTasks: {
            orderBy: { createdAt: "asc" },
          },
        },
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

  function flattenTasks(ts: NonNullable<typeof goal>["tasks"]) {
    const result: Array<{
      id: string;
      title: string;
      status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "ARCHIVED";
      parentTaskId: string | null;
      subTasks: never[];
    }> = [];
    for (const t of ts) {
      result.push({
        id: t.id,
        title: t.title,
        status: t.status as "PENDING" | "IN_PROGRESS" | "COMPLETED" | "ARCHIVED",
        parentTaskId: t.parentTaskId,
        subTasks: [],
      });
      for (const st of t.subTasks) {
        result.push({
          id: st.id,
          title: st.title,
          status: st.status as "PENDING" | "IN_PROGRESS" | "COMPLETED" | "ARCHIVED",
          parentTaskId: st.parentTaskId,
          subTasks: [],
        });
      }
    }
    return result;
  }

  return (
    <AppShell title={goal.title}>
      <Link href={PATHS.goals} className="mb-3 text-xs text-muted">
        ← بازگشت
      </Link>
      <p className="mb-2 text-xs text-muted">
        {goal.horizon === "custom" || goal.horizon === "monthly"
          ? goal.targetEndDate
            ? `هدف ${goal.horizon === "monthly" ? "ماهانه" : "سفارشی"} · تا ${faRelativeDate(new Date(goal.targetEndDate))}`
            : `هدف ${goal.horizon === "monthly" ? "ماهانه" : "سفارشی"}`
          : "هدف بلندمدت"}
        {goal.reminderTime ? ` · یادآوری ساعت ${goal.reminderTime}` : ""}
      </p>
      <p className="mb-4 text-xs text-muted">
        هدف هفتگی:{" "}
        {goal.targetMinutesPerWeek
          ? faMinutes(goal.targetMinutesPerWeek)
          : goal.targetDaysPerWeek
          ? `${faNum(goal.targetDaysPerWeek)} روز`
          : "—"}
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

      <GoalTabs
        goalId={goal.id}
        tasks={flattenTasks(goal.tasks)}
        logs={goal.logs.map((l) => ({
          id: l.id,
          durationMinutes: l.durationMinutes,
          note: l.note,
          loggedAt: l.loggedAt,
          taskId: l.taskId,
        }))}
      />
    </AppShell>
  );
}
