/**
 * قالب‌بندی اعداد و تاریخ فارسی.
 *
 * مرجع طراحی همه‌جا عدد لاتین نشان نمی‌دهد: «۳ از ۸»، «۷:۳۰ صبح»، «۷۸٪».
 * این توابع همان خروجی را می‌سازند. یک جا جمع شده‌اند چون اگر در هر صفحه
 * جدا نوشته شوند، بعد از چند مرحله ناهماهنگ می‌شوند (مثلاً یک صفحه «٪» را
 * قبل از عدد بگذارد و یکی بعد از آن).
 */

const FA_DIGITS = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];

/** هر رقم لاتین در رشته را به فارسی تبدیل می‌کند. */
export function toFa(value: string | number): string {
  return String(value).replace(/[0-9]/g, (d) => FA_DIGITS[Number(d)]);
}

/** عدد با جداکنندهٔ هزارگان و رقم فارسی. */
export function faNum(value: number): string {
  return toFa(value.toLocaleString("en-US"));
}

/** درصد، بدون اعشار، با علامت فارسی. */
export function faPercent(ratio: number): string {
  const pct = Math.round(Math.max(0, Math.min(1, ratio)) * 100);
  return `${toFa(pct)}٪`;
}

/** «۴۵ دقیقه» */
export function faMinutes(minutes: number): string {
  return `${faNum(minutes)} دقیقه`;
}

/**
 * ساعت «HH:mm» دیتابیس را به شکل خوانا تبدیل می‌کند: «۷:۳۰ صبح».
 *
 * ساعت ۲۴ ساعته نگه داشته می‌شود ولی برای نمایش به ۱۲ ساعته می‌رود، چون
 * مرجع طراحی همین قالب را دارد و کاربر فارسی‌زبان با «۱۹:۰۰» راحت‌تر از
 * «۷:۰۰ شب» نیست.
 */
export function faTime(hhmm: string): string {
  const match = /^(\d{1,2}):(\d{2})$/.exec(hhmm.trim());
  if (!match) return hhmm;

  const h = Number(match[1]);
  const m = match[2];
  if (h > 23) return hhmm;

  const period = h < 12 ? "صبح" : h < 17 ? "ظهر" : h < 20 ? "بعدازظهر" : "شب";
  // ساعت ۰ یعنی ۱۲ شب، نه ۰.
  const h12 = h % 12 === 0 ? 12 : h % 12;

  return `${toFa(h12)}:${toFa(m)} ${period}`;
}

const RELATIVE_DAY = 86400000;

function startOfDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

/**
 * تاریخ نسبی برای فهرست لاگ‌ها: «امروز»، «دیروز»، یا تاریخ شمسی.
 *
 * مقایسه بر اساس مرز روز محلی انجام می‌شود نه اختلاف ۲۴ ساعته، وگرنه کاربری
 * که ساعت ۱۱ شب لاگ ثبت کرده «امروز» و ساعت ۱ شب «دیروز» می‌بیند که درست
 * است ولی اختلاف ۲۴ ساعته‌ای این را خراب می‌کند.
 */
export function faRelativeDate(date: Date, now = new Date()): string {
  const diffDays = Math.round((startOfDay(now) - startOfDay(date)) / RELATIVE_DAY);

  if (diffDays === 0) return "امروز";
  if (diffDays === 1) return "دیروز";
  if (diffDays === -1) return "فردا";

  return new Intl.DateTimeFormat("fa-IR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

/** ساعت رویداد به وقت تهران، برای لاگ‌ها. */
export function faClock(date: Date): string {
  return new Intl.DateTimeFormat("fa-IR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

/** نام روز هفته، برای نمایش reminderDays. */
export const WEEKDAY_FA = [
  "یکشنبه",
  "دوشنبه",
  "سه‌شنبه",
  "چهارشنبه",
  "پنجشنبه",
  "جمعه",
  "شنبه",
] as const;

/** نام کوتاه روز هفته برای انتخابگر روزهای یادآوری. */
export const WEEKDAY_SHORT = ["ی", "د", "س", "چ", "پ", "ج", "ش"] as const;
