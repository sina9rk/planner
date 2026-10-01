"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { createGoalAction } from "@/lib/actions/goal-create";
import { primaryButtonClass } from "@/components/ui";
import { WEEKDAY_SHORT } from "@/lib/fa";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={primaryButtonClass}>
      {pending ? "در حال ساخت..." : "ساخت هدف"}
    </button>
  );
}

export function GoalForm() {
  const [, formAction] = useActionState((_: void | null, fd: FormData) => createGoalAction(fd), null);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label className="mb-1 block text-xs text-muted">عنوان هدف</label>
        <input name="title" required maxLength={60} className="w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-sm focus:border-accent focus:outline-none" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs text-muted">هدف دقیقه در هفته</label>
          <input type="number" name="targetMinutesPerWeek" min={0} max={10080} placeholder="مثلاً ۳۰۰" className="w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-sm focus:border-accent focus:outline-none" />
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted">هدف روز در هفته</label>
          <input type="number" name="targetDaysPerWeek" min={1} max={7} placeholder="مثلاً ۴" className="w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-sm focus:border-accent focus:outline-none" />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs text-muted">ساعت یادآوری</label>
        <input name="reminderTime" placeholder="۰۷:۳۰" pattern="^([01]\d|2[0-3]):([0-5]\d)$" className="w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-sm focus:border-accent focus:outline-none" />
      </div>

      <div>
        <label className="mb-1 block text-xs text-muted">روزهای یادآوری (اختیاری)</label>
        <div className="flex flex-wrap gap-2">
          {["0","1","2","3","4","5","6"].map((d, i) => (
            <label key={d} className="flex items-center gap-1 rounded-lg border border-line bg-surface px-2 py-1 text-xs">
              <input type="checkbox" name="reminderDays" value={d} />
              {WEEKDAY_SHORT[i]}
            </label>
          ))}
        </div>
      </div>

      <Submit />
    </form>
  );
}
