/**
 * کامپوننت‌های مشترک بین صفحه‌های auth و مراحل بعدی. عمداً بدون وابستگی به
 * antd نوشته شده‌اند: بریف یک سیستم رنگ با متغیرهای CSS را الزامی کرده که با
 * تم‌پذیری پیش‌فرض antd (که رنگ‌ها را در JS می‌سازد) جور در نمی‌آید. استایل‌ها
 * با کلاس‌های Tailwind روی متغیرهای پروژه نوشته شده‌اند تا با تغییر accent
 * از پروفایل همه‌جا هماهنگ عوض شوند.
 */

import Link from "next/link";
import { toFa } from "@/lib/fa";
import { ACCENT_PRESETS, isThemeMode, type ThemeMode } from "@/lib/theme";

/** پوستهٔ صفحه: پس‌زمینهٔ اپ با حاشیهٔ امن برای WebView. */
export function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-dvh flex-col bg-bg px-4 py-8 text-text">
      <div className="mx-auto flex w-full max-w-sm flex-1 flex-col">
        {children}
      </div>
    </main>
  );
}

/**
 * پوستهٔ صفحات داخل اپ: همان عرض max-w-sm ولی با ناوبری پایین. auth از
 * PageShell استفاده می‌کند چون ناوبری در آن بی‌معنی است.
 */
export function AppShell({
  title,
  action,
  accentTitle,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  /**
   * نوار عنوان تمام‌عرض با پس‌زمینهٔ accent. صفحهٔ جزئیات هدف از این حالت
   * استفاده می‌کند چون عنوان آن باید بیرون از پدینگ معمول صفحه بنشیند.
   * action در این حالت داخل نوار و گوشهٔ راست (سمت شروع متن RTL) می‌نشیند.
   */
  accentTitle?: boolean;
  children: React.ReactNode;
}) {
  return (
    <main className="flex min-h-dvh flex-col bg-bg pb-20 text-text">
      {accentTitle ? (
        <header className="relative mb-4 flex items-center justify-center bg-accent px-4 py-3.5">
          <h1 className="text-center text-[20px] font-bold text-ink ">
            {title}
          </h1>
          {action ? <div className="absolute right-4">{action}</div> : null}
        </header>
      ) : (
        <header></header>
      )}
      <div className="mx-auto w-full max-w-sm flex-1 px-4">{children}</div>
      <BottomNav />
    </main>
  );
}

/** ناوبری پایین؛ جای ناوبری در مرجع طراحی خالی است و حدس خودم است. */
function BottomNav() {
  const items = [
    { href: "/dashboard", label: "داشبورد" },
    { href: "/goals", label: "اهداف" },
    { href: "/tasks", label: "تسک‌ها" },
    { href: "/profile", label: "پروفایل" },
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 border-t border-line bg-surface">
      <ul className="mx-auto flex max-w-sm">
        {items.map((item) => (
          <li key={item.href} className="flex-1">
            <Link
              href={item.href}
              className="block py-3 text-center text-[12px] text-muted transition hover:text-accent"
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/** سربرگ موجی صفحه‌های auth، مطابق مرجع طراحی. */
export function WaveHeader({
  title,
  subtitle,
  mark,
}: {
  title: string;
  subtitle: string;
  mark: string;
}) {
  return (
    <header className="relative -mx-4 -mt-8 flex flex-col items-center justify-center bg-gradient-to-bl from-[#111826] to-bg px-4 pt-12 pb-16">
      <div className="flex h-13 w-13 items-center justify-center rounded-2xl bg-accent text-xl font-bold text-ink">
        {mark}
      </div>
      <h1 className="mt-2.5 text-lg font-bold">{title}</h1>
      <p className="mt-1 text-xs text-muted">{subtitle}</p>

      {/* موج از مرجع طراحی؛ با currentColor پر می‌شود تا لبه‌اش با پس‌زمینه
          یکی دیده شود و نیازی به هاردکد کردن رنگ نباشد. */}
      <svg
        viewBox="0 0 400 40"
        preserveAspectRatio="none"
        aria-hidden="true"
        className="absolute -bottom-px right-0 h-8 w-full text-bg"
      >
        <path
          d="M0 20 C 100 45, 300 -5, 400 20 L400 40 L0 40 Z"
          fill="currentColor"
        />
      </svg>
    </header>
  );
}

/** کارت فرم با همان سطح و بوردر مرجع. */
export function FormCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 flex-col rounded-2xl bg-surface p-5">
      {children}
    </div>
  );
}

/**
 * فیلد با برچسب؛ برچسب و input باید صریح به هم وصل شوند نه فقط با هم
 * چیده شدن، چون وگرنه صفحه‌کلید و screen reader درست کار نمی‌کنند.
 */
export function Field({
  id,
  label,
  hint,
  error,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-4">
      <label htmlFor={id} className="mb-1.5 block text-xs text-muted">
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="mt-1.5 text-xs text-warn">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="mt-1.5 text-xs text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export const inputClass =
  "w-full rounded-xl border border-line bg-surface px-3 py-3 text-sm text-text placeholder:text-muted focus:border-accent focus:outline-none";

export const primaryButtonClass =
  "w-full rounded-xl bg-accent px-3 py-3 text-sm font-bold text-ink transition disabled:opacity-60";

export const ghostButtonClass =
  "w-full rounded-xl border border-line px-3 py-3 text-center text-sm text-text transition hover:bg-raised";

/* ------------------------------------------------- اجزای مراحل ۱ تا ۷ */

/**
 * نوار پیشرفت. ارتفاع ۴ پیکسل و گردی ۴ پیکسل از مرجع طراحی؛ کلاس‌های bar در
 * globals.css هستند چون در هر صفحهٔ دیگر هم لازم می‌شود.
 *
 * percent از قبل clamp شده assumption است؛ اینجا هم clamp می‌کنیم چون مقدار
 * می‌تواند از تقسیم بر صفر بی‌نهایت شود.
 */
export function Bar({ percent }: { percent: number }) {
  const safe = Math.max(0, Math.min(100, percent));
  return (
    <div className="bar flex-1">
      <i style={{ width: `${safe}%` }} />
    </div>
  );
}

/**
 * کارت سه‌خطی با عنوان بولد، همان `.box` مرجع. برای نتیجهٔ پرسونا و کارت‌های
 * برنامهٔ تو استفاده می‌شود.
 */
export function InfoBox({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-2.5 rounded-2xl border border-line bg-surface px-3.5 py-3 text-[13px]">
      <b className="mb-0.5 block text-sm">{title}</b>
      <span className="text-muted">{children}</span>
    </div>
  );
}

/** برچسب کوچک داخل کارت‌ها؛ `.pill` مرجع. */
export function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-block rounded-full bg-raised px-2.5 py-0.5 text-[11px] text-muted">
      {children}
    </span>
  );
}

/** آواتار دایره‌ای با حرف اول نام، همان `.av` مرجع. */
export function Avatar({
  name,
  size = 34,
}: {
  name: string | null;
  size?: number;
}) {
  const letter = name?.trim().charAt(0) || "م";
  return (
    <span
      className="grid shrink-0 place-items-center rounded-full bg-accent font-bold text-ink"
      style={{ width: size, height: size, fontSize: size / 2 }}
    >
      {letter}
    </span>
  );
}

/** کارت آمار؛ `.st .box` مرجع با عدد بزرگ accent. */
export function StatTile({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex-1 rounded-2xl border border-line bg-surface px-1 py-2.5 text-center">
      <b className="block text-lg text-accent">{value}</b>
      <span className="text-[11px] text-muted">{label}</span>
    </div>
  );
}

/**
 * ردیف «برچسب ← مقدار» برای صفحهٔ پروفایل؛ `.li` مرجع با خط جداکننده.
 */
export function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-line px-0.5 py-2.5 text-[13px] last:border-b-0">
      <span className="shrink-0">{label}</span>
      <span className="min-w-0 break-words text-left text-muted">{value}</span>
    </div>
  );
}

/**
 * انتخابگر رنگ با پیش‌نمایش زنده. کلاینتی است چون با کلیک باید فوراً
 * --accent عوض شود تا کاربر قبل از ذخیره، نتیجه را ببیند.
 *
 * رنگ دلخواه با input[type=color] گرفته می‌شود نه رنگ‌یاب سفارشی. مرورگرهای
 * موبایل (که برایشان APK می‌سازیم) رنگ‌یاب سیستمی دارند و دست‌سازی آن پرهزینه
 * و بی‌فایده بود.
 */
export function AccentPicker({
  accent,
  onChange,
}: {
  accent: string;
  onChange: (next: string) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2.5">
        {ACCENT_PRESETS.map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => onChange(preset)}
            aria-label={`رنگ ${preset}`}
            aria-pressed={accent.toUpperCase() === preset.toUpperCase()}
            style={{ background: preset }}
            className={`size-9 rounded-full border-2 transition ${
              accent.toUpperCase() === preset.toUpperCase()
                ? "border-text"
                : "border-transparent"
            }`}
          />
        ))}
      </div>

      <label className="flex items-center gap-3 rounded-[14px] border border-line bg-surface px-3 py-2.5">
        <input
          type="color"
          value={accent}
          onChange={(e) => onChange(e.target.value)}
          className="size-8 shrink-0 cursor-pointer rounded-full border border-line bg-transparent"
        />
        <span className="text-[13px]" dir="ltr">
          {accent}
          <small className="block text-[11px] text-muted">رنگ دلخواه</small>
        </span>
      </label>
    </div>
  );
}

/**
 * انتخابگر حالت نمایش. کلاینتی برای همان پیش‌نمایش زنده.
 *
 * روی data-theme می‌نشیند نه روی یک state جدا، چون خود CSS با همان صفت تصمیم
 * می‌گیرد و این‌طور فقط یک منبع حقیقت داریم.
 */
export function ModePicker({
  mode,
  onChange,
}: {
  mode: ThemeMode;
  onChange: (next: ThemeMode) => void;
}) {
  const options: { value: ThemeMode; label: string }[] = [
    { value: "dark", label: "تیره" },
    { value: "light", label: "روشن" },
  ];

  return (
    <div className="flex gap-2.5">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          aria-pressed={mode === option.value}
          className={`flex-1 rounded-[13px] border px-3 py-2.5 text-[12.5px] transition ${
            mode === option.value
              ? "border-accent text-accent"
              : "border-line text-text hover:bg-raised"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

/** کارت پیش‌نمایش تم؛ `.card` مرجع با برچسب accent. */
export function ThemePreviewCard({ accent }: { accent: string }) {
  return (
    <div className="rounded-2xl border border-line bg-surface px-3.5 py-3.5">
      <div className="mb-0.5 text-[11px] text-accent">کار بعدی</div>
      <b className="mb-2 block text-sm">نوشتن گزارش هفتگی</b>
      <span
        className="block rounded-xl px-3 py-2 text-center text-[13px] font-bold text-ink"
        style={{ background: accent }}
      >
        شروع تمرکز
      </span>
    </div>
  );
}

/** ساعت دوازده‌رقمی با رقم فارسی؛ برای فیلدهای زمان. */
export function TimeHint({ value }: { value: string }) {
  return (
    <span className="text-[11px] text-muted" dir="ltr">
      {toFa(value)}
    </span>
  );
}

/** بررسی این‌که رشته، حالت نمایش معتبر است؛ برای اکشن تم. */
export function isValidMode(value: string): value is ThemeMode {
  return isThemeMode(value);
}
