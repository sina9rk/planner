/**
 * تصمیم مسیر بعدی کاربر در یک نقطهٔ واحد.
 *
 * مسیر کاربر بریف چند مرحله دارد و این تصمیم در چند جا لازم است: اکشن
 * ثبت‌نام، اکشن ورود، صفحهٔ اصلی، و گاردهای صفحه‌ها. وقتی در هر فایل جدا نوشته
 * شود، یک‌جا فراموش می‌شود و کاربر به مسیری می‌رود که وجود ندارد — همان
 * اتفاقی که با ریدایرکت به /onboarding افتاد و 404 داد.
 */

export const PATHS = {
  login: "/login",
  register: "/register",
  dashboard: "/dashboard",
  onboarding: "/onboarding",
  persona: "/persona",
  goals: "/goals",
  goalsNew: "/goals/new",
  tasks: "/tasks",
  profile: "/profile",
} as const;

/** مقصد بعد از ثبت‌نام موفق. */
export function afterRegister(): string {
  return PATHS.onboarding;
}

/**
 * مقصد بعد از ورود موفق.
 *
 * برخلاف حدس اولیه، کاربرِ بدون پرسونا به داشبورد نمی‌رود: داشبورد بر پایهٔ
 * اهداف و پرسونا ساخته شده و برای کسی که هنوز هیچ‌کدام را ندارد صفحهٔ خالی و
 * گمراه‌کننده است. به‌جایش همان کاری می‌شود که صفحهٔ اصلی می‌کند.
 */
export function afterLogin(hasPersona: boolean): string {
  return hasPersona ? PATHS.dashboard : PATHS.onboarding;
}

/** مقصد صفحهٔ اصلی. */
export function afterAuth(hasPersona: boolean): string {
  return hasPersona ? PATHS.dashboard : PATHS.onboarding;
}

/** ترتیب تب‌های ناوبری؛ در nav.tsx استفاده می‌شود. */
export const NAV_ORDER = [
  PATHS.dashboard,
  PATHS.goals,
  PATHS.tasks,
  PATHS.profile,
] as const;
