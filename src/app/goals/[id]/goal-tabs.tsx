"use client";

import { useState, useActionState } from "react";
import { addGoalLogAction } from "@/lib/actions/goal-log";
import { toggleTaskAction, completeTaskWithLogAction } from "@/lib/actions/tasks";
import { PATHS } from "@/lib/flow";
import { faClock, faMinutes, faRelativeDate } from "@/lib/fa";
import { primaryButtonClass, ghostButtonClass } from "@/components/ui";
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

function AddLogForm({ goalId }: { goalId: string }) {
  const [, formAction] = useActionState((_: void | null, fd: FormData) => addGoalLogAction(fd), null);

  return (
    <form action={formAction} className="rounded-2xl border border-dashed border-line bg-surface p-4">
      <input type="hidden" name="goalId" value={goalId} />
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
  );
}

export function GoalTabs({
  goalId,
  tasks,
  logs,
}: {
  goalId: string;
  tasks: Task[];
  logs: GoalLog[];
}) {
  const [activeTab, setActiveTab] = useState("tasks");
  const [openModal, setOpenModal] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [, toggleTask] = useActionState((_: void | null, fd: FormData) => toggleTaskAction(fd), null);
  const [, completeWithLog] = useActionState(
    (_: void | null, fd: FormData) => completeTaskWithLogAction(fd),
    null
  );

  function buildTree(ts: Task[]) {
    const map = new Map<string, Task>();
    ts.forEach((t) => map.set(t.id, { ...t, subTasks: [] }));
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

  function handleToggle(taskId: string, status: Task["status"]) {
    if (status === "COMPLETED") return;
    setSelectedTaskId(taskId);
    setOpenModal(true);
  }

  function renderTask(task: Task, depth = 0) {
    const isCompleted = task.status === "COMPLETED";
    return (
      <div key={task.id} className={depth > 0 ? "mr-6 border-r border-line pr-3" : ""}>
        <form action={toggleTask} className="mb-2 flex items-center gap-3 rounded-xl border border-line bg-surface px-3 py-2">
          <input type="hidden" name="taskId" value={task.id} />
          <input type="hidden" name="redirectTo" value={`${PATHS.goals}/${goalId}`} />
          <input
            type="checkbox"
            checked={isCompleted}
            onChange={() => handleToggle(task.id, task.status)}
            className="size-5 accent-accent"
            disabled={isCompleted}
          />
          <span className={`flex-1 text-sm ${isCompleted ? "text-muted line-through" : ""}`}>
            {task.title}
          </span>
        </form>
        {task.subTasks.length > 0 && (
          <div className="space-y-2">{task.subTasks.map((st) => renderTask(st, depth + 1))}</div>
        )}
      </div>
    );
  }

  const tree = buildTree(tasks);

  return (
    <>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4 w-full">
          <TabsTrigger value="tasks">تسک‌ها</TabsTrigger>
          <TabsTrigger value="history">تاریخچه</TabsTrigger>
        </TabsList>
        <TabsContent value="tasks">
          <div className="space-y-3">
            {tree.length === 0 && (
              <p className="py-4 text-center text-xs text-muted">هنوز تسکی ثبت نشده</p>
            )}
            {tree.map((t) => renderTask(t))}
          </div>
        </TabsContent>
        <TabsContent value="history">
          <div className="mb-4">
            <AddLogForm goalId={goalId} />
          </div>
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

      <Dialog open={openModal} onOpenChange={setOpenModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>چقدر طول کشید؟</DialogTitle>
            <DialogDescription>
              اگر پر شد، یک GoalLog با taskId ساخته می‌شه؛ اگر خالی رها شد، فقط تسک تکمیل می‌شه.
            </DialogDescription>
          </DialogHeader>
          <form action={completeWithLog} className="space-y-3">
            <input type="hidden" name="taskId" value={selectedTaskId || ""} />
            <input type="hidden" name="redirectTo" value={`${PATHS.goals}/${goalId}`} />
            <input
              type="number"
              name="durationMinutes"
              min={1}
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
                ثبت و تکمیل
              </button>
              <DialogClose
                render={
                  <button
                    type="submit"
                    formAction={toggleTask}
                    onClick={() => {
                      const form = document.createElement("form");
                      form.action = "";
                    }}
                    className={ghostButtonClass}
                  />
                }
              >
                فقط تکمیل
              </DialogClose>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
