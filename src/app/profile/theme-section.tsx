"use client";

import { useEffect, useState } from "react";
import { AccentPicker, ModePicker, ThemePreviewCard } from "@/components/ui";
import { resetThemeAction, saveThemeAction } from "@/lib/actions/theme";
import {
  DEFAULT_ACCENT,
  normalizeAccent,
  type ThemeMode,
} from "@/lib/theme";

/**
 * بخش «تم اپ» صفحهٔ پروفایل.
 *
 * کلاینتی است چون انتخاب رنگ باید پیش از ذخیره زنده دیده شود: هر کلیک هم state
 * محلی را عوض می‌کند و هم همان لحظه `data-theme` و `--accent` را روی <html>
 * می‌نویسد. اگر منتظر ذخیره می‌ماندیم کاربر تا لحظهٔ زدن دکمه هیچ خبری از نتیجه
 * نمی‌داشت. متغیرها را دستی از همین‌جا می‌نویسیم نه از یک state جدا، چون خودِ
 * layout همین دو را روی <html> می‌گذارد و دو منبع حقیقت یعنی رنگ‌ها ناهماهنگ.
 *
 * مقایسه با props برای تشخیص «ذخیره‌نشده» عمداً است: بعد از ذخیره، اکشن
 * revalidatePath می‌کند و props تازه می‌آیند، پس state جدا برای «آخرین مقدار
 * ذخیره‌شده» فقط یک منبع حقیقت دیگر می‌شد که باید دستی sync می‌ماند.
 */
export function ThemeSection({
  initialAccent,
  initialMode,
}: {
  initialAccent: string;
  initialMode: ThemeMode;
}) {
  const [accent, setAccent] = useState(initialAccent);
  const [mode, setMode] = useState<ThemeMode>(initialMode);

  const dirty =
    accent.toUpperCase() !== initialAccent.toUpperCase() || mode !== initialMode;

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = mode;
    root.style.setProperty("--accent", accent);
  }, [accent, mode]);

  return (
    <section>
      <h2 className="mb-1 text-sm font-bold">تم اپ</h2>
      <p className="mb-3 text-xs text-muted">
        رنگ تأکید را خودت انتخاب کن. پس‌زمینه و متن برای خوانایی ثابت می‌مانند.
      </p>

      <form action={saveThemeAction}>
        <input type="hidden" name="accent" value={accent} />
        <input type="hidden" name="mode" value={mode} />

        <div className="rounded-2xl border border-line bg-surface p-4">
          <p className="mb-2 text-xs text-muted">رنگ‌های پیشنهادی</p>
          <AccentPicker
            accent={accent}
            onChange={(next) => setAccent(normalizeAccent(next))}
          />

          <p className="mt-4 mb-2 text-xs text-muted">حالت نمایش</p>
          <ModePicker mode={mode} onChange={setMode} />

          <div className="mt-4 flex gap-2">
            <button
              type="submit"
              disabled={!dirty}
              className="flex-1 rounded-xl bg-accent px-3 py-2.5 text-sm font-bold text-ink transition disabled:opacity-50"
            >
              ذخیره
            </button>
            {/* formAction اکشنِ دیگری را روی همان فرم صدا می‌زند، بدون اینکه
                لازم باشد فرم دوم بسازیم. */}
            <button
              type="submit"
              formAction={resetThemeAction}
              onClick={() => {
                setAccent(DEFAULT_ACCENT);
                setMode("dark");
              }}
              disabled={!dirty}
              className="rounded-xl border border-line px-3 py-2.5 text-sm text-text transition hover:bg-raised disabled:opacity-50"
            >
              ریست
            </button>
          </div>
        </div>
      </form>

      <p className="mt-4 mb-2 text-xs text-muted">پیش‌نمایش زنده</p>
      <ThemePreviewCard accent={accent} />
    </section>
  );
}