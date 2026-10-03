"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { addGoalLogAction } from "@/lib/actions/goal-log";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
  ghostButtonClass,
  inputClass,
  primaryButtonClass,
} from "@/components/ui";
import { WheelPicker, WheelPickerWrapper } from "@/components/wheel-picker";
import { TimeInput } from "./time-input";
import { RichTextEditor } from "./rich-text-editor";

// Helper برای ساخت آرایه اعداد
const createArray = (length: number, add = 0) =>
  Array.from({ length }, (_, i) => {
    const value = i + add;
    return {
      label: value.toString().padStart(2, "0"),
      value: value,
    };
  });

const hourOptions = createArray(24); // 0-23
const minuteOptions = createArray(60); // 0-59

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={primaryButtonClass}>
      {pending ? "در حال ثبت..." : "ثبت کن"}
    </button>
  );
}
function htmlToText(html: string): string {
  const doc = new DOMParser().parseFromString(html, "text/html");
  return doc.body.textContent || "";
}
export function AddLogSheet({ goalId }: { goalId: string }) {
  const [open, setOpen] = useState(false);
  const [durationMinutes, setDurationMinutes] = useState(45); // مقدار پیش‌فرض
  const [note, setNote] = useState("");
  const [state, formAction] = useActionState<{ ok: boolean } | null, FormData>(
    async (_prev, fd) => {
      fd.set("note", htmlToText(note)); // ← اضافه کنید
      const result = await addGoalLogAction(fd);
      if (result?.ok) {
        setOpen(false);
        setDurationMinutes(0);
        setNote(""); // ← ریست ادیتور
      }
      return result;
    },
    null,
  );
  // محاسبه ساعت و دقیقه از durationMinutes
  const hours = Math.floor(durationMinutes / 60);
  const minutes = durationMinutes % 60;

  const handleHourChange = (newHour: number) => {
    setDurationMinutes(newHour * 60 + minutes);
  };

  const handleMinuteChange = (newMinute: number) => {
    setDurationMinutes(hours * 60 + newMinute);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-20 left-4 grid size-11 place-items-center rounded-full bg-accent text-2xl font-bold text-ink shadow-lg"
      >
        +
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          showCloseButton={false}
          className="inset-x-0 top-auto bottom-0 mx-auto w-full max-w-sm translate-x-0 translate-y-0 rounded-none rounded-t-2xl p-0 data-open:slide-in-from-bottom data-open:zoom-in-100 data-closed:slide-out-to-bottom data-closed:zoom-out-100"
        >
          <div className=" w-14 bg-[#1f2631] h-2 rounded-full  m-auto mt-3"></div>

          <form action={formAction} className="space-y-4 m-4">
            <input type="hidden" name="goalId" value={goalId} />
            {/* این input مخفی مقدار نهایی را به اکشن می‌فرستد */}
            <input
              type="hidden"
              name="durationMinutes"
              value={durationMinutes}
            />

            <div className="space-y-2">
              <span className="block text-xs text-muted">مدت زمان</span>
              <TimeInput
                value={durationMinutes}
                onChange={setDurationMinutes}
              />
            </div>

            <div>
              <span className="mb-1.5 block text-xs text-muted">
                چی کار کردی؟ (اختیاری)
              </span>
              <RichTextEditor
                value={note}
                onChange={setNote}
                placeholder="چی کار کردی؟"
              />
            </div>

            <div className="flex gap-3">
              <Submit />
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
