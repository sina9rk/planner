import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowRightIcon } from "lucide-react";
import { requirePersona } from "@/lib/guards";
import { prisma } from "@/lib/prisma";
import { AppShell, StatTile } from "@/components/ui";
import { PATHS } from "@/lib/flow";
import { faClock, faMinutes, faNum, faPercent, faRelativeDate } from "@/lib/fa";
import { AddLogSheet } from "./add-log-sheet";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { GoalTasks } from "./goal-tasks";

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
      },
    },
  });

  if (!goal) notFound();

  const since = new Date();
  since.setDate(since.getDate() - 7);
  const logsThisWeek = goal.logs.filter((l) => l.loggedAt >= since);
  const doneMinutesWeek = logsThisWeek.reduce(
    (s, l) => s + l.durationMinutes,
    0,
  );
  const doneDaysWeek = new Set(
    logsThisWeek.map((l) => l.loggedAt.toDateString()),
  ).size;

  let ratio = 0;
  if (goal.targetMinutesPerWeek && goal.targetMinutesPerWeek > 0) {
    ratio = Math.min(1, doneMinutesWeek / goal.targetMinutesPerWeek);
  } else if (goal.targetDaysPerWeek && goal.targetDaysPerWeek > 0) {
    ratio = Math.min(1, doneDaysWeek / goal.targetDaysPerWeek);
  }

  const completedTasksCount = goal.tasks.filter(
    (t) => t.status === "COMPLETED",
  ).length;
  const totalTasksCount = goal.tasks.length;

  return (
    <AppShell
      title={goal.title}
      accentTitle
      action={
        <Link
          href={PATHS.goals}
          aria-label="بازگشت به اهداف"
          className="block text-ink"
        >
          <ArrowRightIcon className="size-5" />
        </Link>
      }
    >
      <p className="mb-4 text-xs text-accent bg-[#1D2430] rounded-[20px] py-0.75 px-2.5">
        هدف هفتگی :{"   "}
        {goal.targetMinutesPerWeek
          ? faMinutes(goal.targetMinutesPerWeek)
          : goal.targetDaysPerWeek
            ? `${faNum(goal.targetDaysPerWeek)} روز`
            : "—"}
        {goal.reminderTime ? ` · یادآوری ساعت ${goal.reminderTime}` : ""}
      </p>

      <div className="mb-4 grid grid-cols-3 gap-2">
        <StatTile value={faMinutes(doneMinutesWeek)} label="این هفته" />
        <StatTile
          value={`${faNum(completedTasksCount)} از ${faNum(totalTasksCount)}`}
          label="تسک انجام‌شده"
        />
        <StatTile value={faPercent(ratio)} label="از هدف" />
      </div>

      <Tabs defaultValue="tasks">
        <TabsList className="mb-4 w-full">
          <TabsTrigger value="tasks">تسک‌ها</TabsTrigger>
          <TabsTrigger value="history">تاریخچه</TabsTrigger>
        </TabsList>
        <TabsContent value="tasks">
          <GoalTasks goalId={goal.id} tasks={goal.tasks} />
        </TabsContent>
        <TabsContent value="history">
          <div className="space-y-2">
            {goal.logs.map((log) => (
              <div
                key={log.id}
                className="flex min-w-0 items-start gap-3 border-b border-line py-3 last:border-0"
              >
                <div className="mt-2 size-2 shrink-0 rounded-full bg-accent" />
                <div className="min-w-0 flex-1">
                  <b className="block text-text">
                    {faMinutes(log.durationMinutes)}
                  </b>
                  <span className="block break-words text-xs text-muted">
                    {log.note || "—"} · {faRelativeDate(log.loggedAt)} ·{" "}
                    {faClock(log.loggedAt)}
                  </span>
                </div>
              </div>
            ))}
            {goal.logs.length === 0 && (
              <p className="py-4 text-center text-xs text-muted">
                هنوز لاگی ثبت نشده
              </p>
            )}
          </div>

          <div className="mt-4 pb-2">
            <AddLogSheet goalId={goal.id} />
          </div>
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}
