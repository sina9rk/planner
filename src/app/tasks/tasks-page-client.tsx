"use client";

import { useState, useActionState } from "react";
import { completeTaskAction } from "@/lib/actions/task-actions";
import { faClock, faRelativeDate } from "@/lib/fa";
import { AppShell } from "@/components/ui";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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
import { PATHS } from "@/lib/flow";

type Task = {
  id: string;
  title: string;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "ARCHIVED";
  scheduledFor: Date | null;
  deadline: Date | null;
  goalId: string | null;
  goalTitle: string | null;
  completedAt: Date | null;
  createdAt?: Date;
};

type GroupedTasks = {
  title: string;
  tasks: Task[];
};

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}



function startOfWeek(d: Date) {
  const date = new Date(d);
  date.setHours(0, 0, 0, 0);
  const shift = (date.getDay() + 1) % 7;
  date.setDate(date.getDate() - shift);
  return date;
}

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function groupByDay(tasks: Task[], now: Date): GroupedTasks[] {
  const groups: Record<string, Task[]> = {};
  const today = startOfDay(now);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  for (const t of tasks) {
    let key = "دیگر";
    const ref = t.scheduledFor || t.deadline;
    if (ref) {
      const r = startOfDay(ref);
      if (isSameDay(r, today)) key = "امروز";
      else if (isSameDay(r, yesterday)) key = "دیروز";
      else key = faRelativeDate(ref, now);
    } else if (t.completedAt) {
      const c = startOfDay(t.completedAt);
      if (isSameDay(c, today)) key = "امروز (تکمیل‌شده)";
      else if (isSameDay(c, yesterday)) key = "دیروز (تکمیل‌شده)";
      else key = `${faRelativeDate(c, now)} (تکمیل‌شده)`;
    } else {
      key = "بدون زمان‌بندی";
    }
    if (!groups[key]) groups[key] = [];
    groups[key].push(t);
  }

  return Object.entries(groups).map(([title, tasks]) => ({
    title,
    tasks: tasks.sort((a, b) => {
      const aTime = a.scheduledFor?.getTime() || a.deadline?.getTime() || a.createdAt?.getTime?.() || 0;
      const bTime = b.scheduledFor?.getTime() || b.deadline?.getTime() || b.createdAt?.getTime?.() || 0;
      return aTime - bTime;
    }),
  }));
}

function groupByWeek(tasks: Task[], now: Date): GroupedTasks[] {
  const groups: Record<string, Task[]> = {};
  const weekStart = startOfWeek(now);
  const nextWeek = new Date(weekStart);
  nextWeek.setDate(nextWeek.getDate() + 7);
  const prevWeek = new Date(weekStart);
  prevWeek.setDate(prevWeek.getDate() - 7);

  for (const t of tasks) {
    const ref = t.scheduledFor || t.deadline || t.completedAt || new Date();
    const r = startOfDay(ref);
    let key = "هفته دیگر";
    if (r >= weekStart && r < nextWeek) key = "این هفته";
    else if (r >= prevWeek && r < weekStart) key = "هفته گذشته";
    else key = faRelativeDate(r, now);
    if (!groups[key]) groups[key] = [];
    groups[key].push(t);
  }
  return Object.entries(groups).map(([title, tasks]) => ({ title, tasks }));
}

function groupByMonth(tasks: Task[], now: Date): GroupedTasks[] {
  const groups: Record<string, Task[]> = {};
  const monthStart = startOfMonth(now);
  const prevMonth = new Date(monthStart.getFullYear(), monthStart.getMonth() - 1, 1);

  for (const t of tasks) {
    const ref = t.scheduledFor || t.deadline || t.completedAt || new Date();
    const r = new Date(ref.getFullYear(), ref.getMonth(), 1);
    let key = "ماه دیگر";
    if (r.getTime() === monthStart.getTime()) key = "این ماه";
    else if (r.getTime() === prevMonth.getTime()) key = "ماه گذشته";
    else key = new Intl.DateTimeFormat("fa-IR", { month: "long", year: "numeric" }).format(ref);
    if (!groups[key]) groups[key] = [];
    groups[key].push(t);
  }
  return Object.entries(groups).map(([title, tasks]) => ({ title, tasks }));
}

export function TasksPageClient({ tasks }: { tasks: Task[] }) {
  const [activeTab, setActiveTab] = useState("day");
  const [openDurationModal, setOpenDurationModal] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [, completeTask] = useActionState(
    (_: void | null, fd: FormData) => completeTaskAction(fd),
    null
  );
  const now = new Date();

  function handleTaskToggle(taskId: string, status: Task["status"]) {
    if (status === "COMPLETED") return;
    setSelectedTaskId(taskId);
    setOpenDurationModal(true);
  }

  const filtered = tasks.filter((t) => t.status !== "ARCHIVED");
  const dayGroups = groupByDay(filtered, now);
  const weekGroups = groupByWeek(filtered, now);
  const monthGroups = groupByMonth(filtered, now);

  function renderTask(t: Task) {
    const isCompleted = t.status === "COMPLETED";
    return (
      <div key={t.id} className="flex items-center gap-3 rounded-xl border border-line bg-surface px-3 py-2">
        <input
          type="checkbox"
          checked={isCompleted}
          onChange={() => handleTaskToggle(t.id, t.status)}
          className="size-5 accent-accent"
          disabled={isCompleted}
        />
        <span className={`flex-1 text-sm ${isCompleted ? "text-muted line-through" : ""}`}>
          {t.title}
        </span>
        {t.goalId && t.goalTitle && (
          <span className="rounded-full bg-raised px-2 py-0.5 text-[10px] text-accent">{t.goalTitle}</span>
        )}
        {(t.scheduledFor || t.deadline) && !isCompleted && (
          <span className="text-[10px] text-warn">
            {faClock(t.scheduledFor || t.deadline!)}
          </span>
        )}
      </div>
    );
  }

  function renderGroups(groups: GroupedTasks[]) {
    return groups.map((g) => (
      <div key={g.title} className="mb-4">
        <h3 className="mb-2 text-xs text-muted">{g.title}</h3>
        <div className="space-y-2">{g.tasks.map(renderTask)}</div>
      </div>
    ));
  }

  return (
    <AppShell title="تسک‌های من">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4 w-full">
          <TabsTrigger value="day">روز</TabsTrigger>
          <TabsTrigger value="week">هفته</TabsTrigger>
          <TabsTrigger value="month">ماه</TabsTrigger>
        </TabsList>
        <TabsContent value="day">{renderGroups(dayGroups)}</TabsContent>
        <TabsContent value="week">{renderGroups(weekGroups)}</TabsContent>
        <TabsContent value="month">{renderGroups(monthGroups)}</TabsContent>
      </Tabs>

      <Dialog open={openDurationModal} onOpenChange={setOpenDurationModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>چقدر طول کشید؟</DialogTitle>
            <DialogDescription>
              اگر این تسک مربوط به یه هدفه و می‌خوای زمانش ثبت شه، مدت رو وارد کن.
            </DialogDescription>
          </DialogHeader>
          <form action={completeTask} className="space-y-3">
            <input type="hidden" name="taskId" value={selectedTaskId || ""} />
            <input type="hidden" name="redirectTo" value={PATHS.tasks} />
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
