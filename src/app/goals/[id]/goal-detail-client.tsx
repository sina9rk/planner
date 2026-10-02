"use client";

import { useState, useActionState } from "react";
import Link from "next/link";
import { completeTaskAction } from "@/lib/actions/task-actions";
import { addFreeGoalLogAction } from "@/lib/actions/free-log";
import { PATHS } from "@/lib/flow";
import { faClock, faMinutes, faNum, faPercent, faRelativeDate } from "@/lib/fa";
import { AppShell } from "@/components/ui";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { primaryButtonClass, ghostButtonClass } from "@/components/ui";

type Task = {
  id: string;
  title: string;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "ARCHIVED";
  parentTaskId: string | null;
  subTasks: Task[];
};

type GoalLog = {
  id: string;
  durationMinutes: number;
  note: string | null;
  loggedAt: Date;
  taskId: string | null;
};

type Goal = {
  id: string;
  title: string;
  horizon: string | null;
  targetEndDate: Date | null;
  targetMinutesPerWeek: number | null;
  targetDaysPerWeek: number | null;
  reminderTime: string | null;
};

export function GoalDetailClient({
  goal,
  doneMinutesWeek,
  doneDaysWeek,
  ratio,
  tasks,
  logs,
}: {
  goal: Goal;
  doneMinutesWeek: number;
  doneDaysWeek: number;
  ratio: number;
  tasks: Task[];
  logs: GoalLog[];
}) {
  const [activeTab, setActiveTab] = useState("tasks");
  const [openDurationModal, setOpenDurationModal] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [, completeTask] = useActionState(
    (_: void | null, fd: FormData) => completeTaskAction(fd),
    null
  );
  const [, freeLog] = useActionState(
    (_: void | null, fd: FormData) => addFreeGoalLogAction(fd),
    null
  );
  const [showFreeLog, setShowFreeLog] = useState(false);

  function handleTaskToggle(taskId: string, status: Task["status"]) {
    if (status === "COMPLETED") return;
    setSelectedTaskId(taskId);
    setOpenDurationModal(true);
  }

  function buildTaskTree(tasks: Task[]) {
    const map = new Map<string, Task>();
    tasks.forEach((t) => map.set(t.id, { ...t, subTasks: [] }));
    const roots: Task[] = [];
    map.forEach((t) => {
      if (t.parentTaskId && map.has(t.parentTaskId)) {
        map.get(t.parentTaskId)?.subTasks.push(t);
      } else {
        roots.push(t);
      }
    });
    return roots;
  }

  const taskTree = buildTaskTree(tasks);

  function renderTask(task: Task, depth = 0) {
    const isCompleted = task.status === "COMPLETED";
    return (
      <div key={task.id} className={depth > 0 ? "mr-6 border-r border-line pr-3" : ""}>
        <div className="mb-2 flex items-center gap-3 rounded-xl border border-line bg-surface px-3 py-2">
          <input
            type="checkbox"
            checked={isCompleted}
            onChange={() => handleTaskToggle(task.id, task.status)}
            className="size-5 accent-accent"
            disabled={isCompleted}
          />
          <span className={`flex-1 text-sm ${isCompleted ? "text-muted line-through" : ""}`}>
            {task.title}
          </span>
        </div>
        {task.subTasks.length > 0 && (
          <div className="space-y-2">{task.subTasks.map((st) => renderTask(st, depth + 1))}</div>
        )}
      </div>
    );
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

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4 w-full">
          <TabsTrigger value="tasks">تسک‌ها</TabsTrigger>
          <TabsTrigger value="history">تاریخچه</TabsTrigger>
        </TabsList>
        <TabsContent value="tasks">
          <div className="space-y-3 pb-4">
            {taskTree.length === 0 && (
              <p className="py-4 text-center text-xs text-muted">هنوز تسکی ثبت نشده</p>
            )}
            {taskTree.map((t) => renderTask(t))}
          </div>
          <button
            onClick={() => setShowFreeLog(!showFreeLog)}
            className="mt-2 w-full rounded-xl border border-accent px-3 py-2.5 text-sm text-accent transition hover:bg-raised"
          >
            + ثبت کار آزاد (بدون تسک مشخص)
          </button>
          {showFreeLog && (
            <form action={freeLog} className="mt-3 rounded-2xl border border-dashed border-line bg-surface p-4">
              <input type="hidden" name="goalId" value={goal.id} />
              <div className="mb-3 flex gap-3">
                <input
                  type="number"
                  name="durationMinutes"
                  min={1}
                  max={1440}
                  required
                  placeholder="مدت (دقیقه)"
                  className="w-24 rounded-lg border border-line bg-raised px-3 py-2 text-sm text-text placeholder:text-muted focus:border-accent focus:outline-none"
                />
                <input
                  name="note"
                  maxLength={200}
                  placeholder="چی کار کردی؟ (اختیاری)"
                  className="flex-1 rounded-lg border border-line bg-raised px-3 py-2 text-sm text-text placeholder:text-muted focus:border-accent focus:outline-none"
                />
              </div>
              <button type="submit" className={primaryButtonClass}>
                ثبت کن
              </button>
            </form>
          )}
        </TabsContent>
        <TabsContent value="history">
          <div className="space-y-2 pb-8">
            {logs.map((log) => (
              <div key={log.id} className="flex items-start gap-3 border-b border-line py-3 last:border-0">
                <div className="mt-2 size-2 shrink-0 rounded-full bg-accent" />
                <div>
                  <b className="block">{faMinutes(log.durationMinutes)}</b>
                  <span className="text-xs text-muted">
                    {log.note || "—"} · {faRelativeDate(new Date(log.loggedAt))} · {faClock(new Date(log.loggedAt))}
                    {log.taskId ? " · از تسک" : ""}
                  </span>
                </div>
              </div>
            ))}
            {logs.length === 0 && (
              <p className="py-4 text-center text-xs text-muted">هنوز لاگی ثبت نشده</p>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={openDurationModal} onOpenChange={setOpenDurationModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>چقدر طول کشید؟</DialogTitle>
            <DialogDescription>
              اگر می‌خوای زمان این تسک توی تاریخچه هدف ثبت شه، مدت رو (دقیقه) وارد کن.
            </DialogDescription>
          </DialogHeader>
          <form action={completeTask} className="space-y-3">
            <input type="hidden" name="taskId" value={selectedTaskId || ""} />
            <input type="hidden" name="redirectTo" value={`${PATHS.goals}/${goal.id}`} />
            <input
              type="number"
              name="durationMinutes"
              min={0}
              max={1440}
              placeholder="مدت (دقیقه) - اختیاری"
              className="w-full rounded-lg border border-line bg-raised px-3 py-2 text-sm text-text placeholder:text-muted focus:border-accent focus:outline-none"
            />
            <input
              name="note"
              maxLength={200}
              placeholder="یادداشت (اختیاری)"
              className="w-full rounded-lg border border-line bg-raised px-3 py-2 text-sm text-text placeholder:text-muted focus:border-accent focus:outline-none"
            />
            <DialogFooter>
              <button type="submit" className={primaryButtonClass}>
                تیک بزن و ثبت کن
              </button>
              <DialogClose render={<button type="button" className={ghostButtonClass} />}>
                فقط تیک بزن
              </DialogClose>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
