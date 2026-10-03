"use client";

import { useState, useActionState } from "react";
import { toggleGoalTaskAction, createGoalTaskAction } from "@/lib/actions/goal-tasks";
import { PATHS } from "@/lib/flow";

type Task = {
  id: string;
  title: string;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "ARCHIVED";
  parentTaskId: string | null;
};

type TreeTask = Task & { subTasks: TreeTask[] };

function buildTree(tasks: Task[]): TreeTask[] {
  const map = new Map<string, TreeTask>();
  tasks.forEach((t) => map.set(t.id, { ...t, subTasks: [] }));
  const roots: TreeTask[] = [];
  map.forEach((t) => {
    if (t.parentTaskId && map.has(t.parentTaskId)) {
      const p = map.get(t.parentTaskId);
      if (p) p.subTasks.push(t);
    } else {
      roots.push(t);
    }
  });
  return roots;
}

export function GoalTasks({ goalId, tasks }: { goalId: string; tasks: Task[] }) {
  const [openDuration, setOpenDuration] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [, toggleTask] = useActionState((_: void | null, fd: FormData) => toggleGoalTaskAction(fd), null);
  const [, createTask] = useActionState((_: void | null, fd: FormData) => createGoalTaskAction(fd), null);

  function handleCheck(taskId: string, status: Task["status"]) {
    if (status === "COMPLETED") return;
    setSelectedTaskId(taskId);
    setOpenDuration(true);
  }

  function renderTask(task: TreeTask, depth = 0) {
    const isCompleted = task.status === "COMPLETED";
    return (
      <div key={task.id} className={depth > 0 ? "mr-6 border-r border-line pr-3" : ""}>
        <div className="mb-2 rounded-2xl border border-line bg-surface px-4 py-4">
          <div className="flex min-w-0 items-center gap-3">
            <input
              type="checkbox"
              checked={isCompleted}
              onChange={() => handleCheck(task.id, task.status)}
              className="size-5 shrink-0 rounded-md accent-accent"
              disabled={isCompleted}
            />
            <span
              className={`min-w-0 flex-1 break-words text-sm text-text ${
                isCompleted ? "text-muted line-through" : ""
              }`}
            >
              {task.title}
            </span>
          </div>
        </div>
        {task.subTasks.length > 0 && task.subTasks.map((st) => renderTask(st, depth + 1))}
        {openDuration && selectedTaskId === task.id && !isCompleted && depth === 0 && (
          <form action={toggleTask} className="mt-2 mr-4 flex items-center gap-2 rounded-lg bg-raised px-2 py-1.5">
            <input type="hidden" name="taskId" value={task.id} />
            <input type="hidden" name="redirectTo" value={`${PATHS.goals}/${goalId}`} />
            <span>⏱</span>
            <input
              type="number"
              name="durationMinutes"
              min={0}
              max={1440}
              placeholder="چقدر طول کشید؟ (دقیقه)"
              className="w-36 bg-transparent text-xs text-text outline-none placeholder:text-muted"
            />
            <button type="submit" className="rounded-md bg-accent px-2 py-0.5 text-[11px] font-bold text-ink">
              ثبت
            </button>
            <button
              type="button"
              onClick={() => setOpenDuration(false)}
              className="rounded-md border border-line px-2 py-0.5 text-[11px] text-text"
            >
              بستن
            </button>
          </form>
        )}
      </div>
    );
  }

  const tree = buildTree(tasks);

  return (
    <div>
      {tree.map((t) => renderTask(t))}
      <form action={createTask} className="mt-2 flex items-center gap-2 rounded-2xl border border-dashed border-line bg-surface px-4 py-3">
        <input type="hidden" name="goalId" value={goalId} />
        <input type="hidden" name="redirectTo" value={`${PATHS.goals}/${goalId}`} />
        <input
          name="title"
          required
          maxLength={120}
          placeholder="عنوان تسک جدید..."
          className="min-w-0 flex-1 rounded-lg border border-line bg-raised px-3 py-2 text-sm text-text placeholder:text-muted focus:border-accent focus:outline-none"
        />
        <button type="submit" className="rounded-lg bg-accent px-3 py-2 text-sm font-bold text-ink">
          افزودن
        </button>
      </form>
    </div>
  );
}
