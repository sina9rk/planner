"use client";

import { useEffect, useState } from "react";
import { AccentPicker, ModePicker, ThemePreviewCard } from "@/components/ui";
import { resetThemeAction, saveThemeAction } from "@/lib/actions/theme";
import {
  DEFAULT_ACCENT,
  normalizeAccent,
  THEME_STORAGE_KEY,
  type StoredTheme,
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
 *
 * هنگام پیش‌نمایش، هم کلاس dark/light و هم صفت data-theme روی <html> عوض
 * می‌شوند: صفت پالت خودِ اپ را عوض می‌کند (globals.css با
 * :root[data-theme="..."] می‌گیردش) و کلاس، واریانت `dark:` تِیلویند و
 * توکن‌های shadcn را. layout هر دو را از دیتابیس روی <html> می‌گذارد، پس
 * سرور و اولین رندر کلاینت یکی‌اند. حالت روشن هم همین‌جا معنا پیدا می‌کند:
 * تا وقتی کلاس و صفت عوض نشوند، انتخاب «روشن» هیچ اثری روی CSS نداشت.
 *
 * localStorage فقط آینهٔ نوشتنیِ مقدار ذخیره‌شده است و هیچ‌جا خوانده نمی‌شود:
 * خواندنش هنگام رندر یک منبع حقیقت دوم می‌ساخت که با دیتابیس فرق می‌کرد و
 * همان hydration mismatch را برمی‌گرداند.
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

  /*
    mounted یک تضمین است، نه منبع حالت: مقدار اولیهٔ state همان props است، پس
    مقایسه در اولین رندر کلاینت هم به‌هرحال false است و این گیت امروز چیزی را
    عوض نمی‌کند. کارکردش این است که اگر روزی کسی مقدار اولیهٔ state را از
    localStorage یا matchMedia گرفت، رندر اول همچنان با HTML سرور یکی بماند.
  */

  const dirty =
    accent.toUpperCase() !== initialAccent.toUpperCase() ||
    mode !== initialMode;

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", mode === "dark");
    root.classList.toggle("light", mode === "light");
    root.dataset.theme = mode;
    root.style.setProperty("--accent", accent);
  }, [accent, mode]);

  // آینهٔ نوشتنی: مقدارِ ذخیره‌شده در دیتابیس اینجا کش می‌شود تا بعداً
  // (اسکریپت پیش از hydration یا اجرای آفلاین در WebView) قابل خواندن باشد.
  useEffect(() => {
    try {
      const snapshot: StoredTheme = {
        accent: initialAccent,
        mode: initialMode,
      };
      window.localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(snapshot));
    } catch {
      // حافظهٔ مرورگر در دسترس نیست (حالت خصوصی)؛ دیتابیس منبع حقیقت می‌ماند.
    }
  }, [initialAccent, initialMode]);

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
