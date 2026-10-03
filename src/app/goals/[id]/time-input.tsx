"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { WheelPicker, WheelPickerWrapper } from "@/components/wheel-picker";
import { cn } from "@/lib/utils";

const createArray = (length: number) =>
  Array.from({ length }, (_, i) => ({
    label: i.toString().padStart(2, "0"),
    value: i,
  }));

const hourOptions = createArray(24);
const minuteOptions = createArray(60);

type TimeInputProps = {
  value: number;
  onChange: (minutes: number) => void;
  placeholder?: string;
  className?: string;
};

export function TimeInput({
  value,
  onChange,
  placeholder = "انتخاب زمان",
  className,
}: TimeInputProps) {
  const [open, setOpen] = useState(false);

  const hours = Math.floor(value / 60);
  const minutes = value % 60;

  const handleHourChange = (newHour: number) => {
    onChange(newHour * 60 + minutes);
  };

  const handleMinuteChange = (newMinute: number) => {
    onChange(hours * 60 + newMinute);
  };

  const displayValue =
    value > 0
      ? `${hours.toString().padStart(2, "0")}:${minutes
          .toString()
          .padStart(2, "0")}`
      : "";

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "flex w-full items-center justify-between rounded-xl border border-line bg-surface px-4 py-3 text-right text-sm transition",
          "hover:bg-raised focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50",
          !displayValue && "text-muted",
          className,
        )}
      >
        <span>{displayValue || placeholder}</span>
        <span className="text-muted text-xs">⏱</span>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          showCloseButton={false}
          className="inset-x-0 top-auto bottom-0 mx-auto w-full max-w-sm translate-x-0 translate-y-0 rounded-none rounded-t-2xl p-0 data-open:slide-in-from-bottom data-open:zoom-in-100 data-closed:slide-out-to-bottom data-closed:zoom-out-100"
        >
          <div className="w-14 bg-[#1f2631] h-2 rounded-full m-auto mt-3"></div>

          <div className="p-4 space-y-4">
            <div
              dir="ltr"
              className="mx-auto flex max-w-fit items-center justify-center gap-1"
            >
              <WheelPickerWrapper className="w-40!">
                <WheelPicker
                  options={hourOptions}
                  value={hours}
                  onValueChange={handleHourChange}
                  infinite
                />
              </WheelPickerWrapper>

              <div className="text-lg font-bold text-muted">:</div>

              <WheelPickerWrapper className="w-40!">
                <WheelPicker
                  options={minuteOptions}
                  value={minutes}
                  onValueChange={handleMinuteChange}
                  infinite
                />
              </WheelPickerWrapper>
            </div>

            <button
              type="button"
              onClick={() => setOpen(false)}
              className="w-full rounded-xl bg-accent py-3 text-sm font-bold text-ink transition hover:opacity-90"
            >
              تأیید
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
