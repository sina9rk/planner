"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { addGoalLogAction } from "@/lib/actions/goal-log";
import { primaryButtonClass } from "@/components/ui";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={primaryButtonClass}>
      {pending ? "در حال ثبت..." : "ثبت کن"}
    </button>
  );
}

export function AddLogForm({ goalId }: { goalId: string }) {
  const [, formAction] = useActionState((state: void | null, fd: FormData) => {
    void state;
    return addGoalLogAction(fd);
  }, null);

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
      <Submit />
    </form>
  );
}
