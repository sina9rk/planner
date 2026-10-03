/**
 * تم اپ. بریف اجازه می‌دهد کاربر فقط بین دو حالت نمایش سوییچ کند و رنگ
 * تأکید را آزادانه عوض کند. بقیهٔ رنگ‌ها در globals.css بر اساس حالت تعریف
 * شده‌اند تا خوانایی همیشه تضمین شود.
 */

export type ThemeMode = "dark" | "light";

export const THEME_MODES: readonly ThemeMode[] = ["dark", "light"];

export const DEFAULT_ACCENT = "#7DD3C0";

/** رنگ‌های پیشنهادی، همان‌هایی که در مرجع طراحی آمده. */
export const ACCENT_PRESETS: readonly string[] = [
  "#7DD3C0",
  "#7DA6D3",
  "#D3A67D",
  "#C97DD3",
  "#D37D86",
];

export function isThemeMode(value: string): value is ThemeMode {
  return THEME_MODES.includes(value as ThemeMode);
}

/**
 * دیتابیس یک رشتهٔ آزاد برای themeAccent نگه می‌دارد، چون کاربر می‌تواند هر
 * رنگی را از رنگ‌یاب آزاد بگیرد. اینجا معتبر بودنش را چک می‌کنیم، چون یک
 * مقدار خراب در CSS یعنی کل رنگ‌آمیزی اپ می‌ریزد.
 *
 * فقط hex ۳ یا ۶ رقمی پذیرفته می‌شود. عمداً rgb()/hsl() را رد می‌کنیم چون
 * در متغیرهای CSS داخل style attribute نیاز به escape دارد و می‌تواند
 * برای تزریق CSS استفاده شود.
 */
export function isValidAccent(value: string): boolean {
  return /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(value.trim());
}

export function normalizeAccent(value: string | null | undefined): string {
  if (value && isValidAccent(value)) {
    const hex = value.trim();
    // به حروف بزرگ یکسان‌سازی می‌کنیم تا دو کاربر با یک رنگ، مقدار
    // متفاوت در دیتابیس نداشته باشند.
    return hex.length === 4
      ? `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`.toUpperCase()
      : hex.toUpperCase();
  }
  return DEFAULT_ACCENT;
}

export function normalizeThemeMode(value: string | null | undefined): ThemeMode {
  return isThemeMode(value ?? "") ? (value as ThemeMode) : "dark";
}

/**
 * رشتهٔ inline style که روی <html> می‌نشیند. فقط --accent را اینجا
 * می‌نویسیم؛ بقیهٔ متغیرها از انتخابگر data-theme می‌آیند تا منطق رنگ در
 * یک جا (globals.css) بماند.
 */
export function themeStyle(accent: string): string {
  return `--accent:${normalizeAccent(accent)}`;
}

/**
 * کلید localStorage که نسخهٔ ذخیره‌شدهٔ تم در آن آینه می‌شود.
 *
 * فقط نوشتنی است: منبع حقیقت برای رندر همان دیتابیس است و این مقدار هیچ‌وقت
 * هنگام رندر خوانده نمی‌شود، چون خواندنِ آن بین سرور و کلاینت فرق می‌کرد و
 * همان hydration mismatch را برمی‌گرداند. فعلاً برای مصرف بعدی نگه داشته
 * می‌شود (اسکریپت پیش از hydration یا اجرای آفلاین در WebView).
 */
export const THEME_STORAGE_KEY = "planner:theme";

/** شکل مقداری که زیر THEME_STORAGE_KEY ذخیره می‌شود. */
export type StoredTheme = { accent: string; mode: ThemeMode };
