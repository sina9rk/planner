import "@ncdai/react-wheel-picker/style.css";

import type { ComponentProps } from "react";
import * as WheelPickerPrimitive from "@ncdai/react-wheel-picker";

import { cn } from "@/lib/utils";

type WheelPickerValue = WheelPickerPrimitive.WheelPickerValue;

type WheelPickerOption<T extends WheelPickerValue = string> =
  WheelPickerPrimitive.WheelPickerOption<T>;

type WheelPickerClassNames = WheelPickerPrimitive.WheelPickerClassNames;

function WheelPickerWrapper({
  className,
  ...props
}: ComponentProps<typeof WheelPickerPrimitive.WheelPickerWrapper>) {
  return (
    <WheelPickerPrimitive.WheelPickerWrapper
      className={cn(
        // پس‌زمینه و حاشیه هماهنگ با تم برنامه
        "w-40 rounded-xl border border-line bg-raised px-1",
        // گوشه‌های ناحیه هایلایت
        "*:data-rwp:first:*:data-rwp-highlight-wrapper:rounded-s-lg",
        "*:data-rwp:last:*:data-rwp-highlight-wrapper:rounded-e-lg",
        className,
      )}
      {...props}
    />
  );
}

function WheelPicker<T extends WheelPickerValue = string>({
  classNames,
  optionItemHeight = 30, // ارتفاع پیش‌فرض هر آیتم (کوچک‌تر از پیش‌فرض)
  ...props
}: WheelPickerPrimitive.WheelPickerProps<T>) {
  return (
    <WheelPickerPrimitive.WheelPicker
      optionItemHeight={optionItemHeight}
      classNames={{
        optionItem: cn(
          // متن آیتم‌های غیرفعال: خاکستری ملایم تم
          "text-sm text-muted data-disabled:opacity-40",
          classNames?.optionItem,
        ),
        highlightWrapper: cn(
          // ناحیه هایلایت: پس‌زمینه سطح + متن اصلی
          "bg-surface text-text",
          // فوکوس: رنگ accent
          "data-rwp-focused:inset-ring-2 data-rwp-focused:inset-ring-accent",
          classNames?.highlightWrapper,
        ),
        highlightItem: cn(
          // آیتم انتخاب‌شده: رنگ accent و فونت بولد
          "text-accent font-bold data-disabled:opacity-40",
          classNames?.highlightItem,
        ),
      }}
      {...props}
    />
  );
}

export { WheelPicker, WheelPickerWrapper };
export type { WheelPickerClassNames, WheelPickerOption };
