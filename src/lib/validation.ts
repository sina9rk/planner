import { z } from "zod";

/**
 * bcrypt فقط ۷۲ بایت اول رمز را هش می‌کند و بقیه را بی‌صدا دور می‌ریزد.
 * اگر این سقف را نگذاریم، دو رمز متفاوت که فقط در بایت‌های بعدی فرق دارند
 * هش یکسان می‌گیرند. سقف را روی «بایت» می‌سنجیم نه «کاراکتر»، چون فارسی
 * هر کاراکترش ۲ بایت UTF-8 است.
 */
const PASSWORD_MAX_BYTES = 72;

/**
 * پیام‌های خطا کنار شمارندهٔ بایت در فرم ثبت‌نام نمایش داده می‌شوند و آن
 * شمارنده با ارقام فارسی است؛ پس اینجا هم فارسی می‌نویسیم تا کنار هم
 * ناهماهنگ نباشند. (آزمون مرورگری همین ناهماهنگی را پیدا کرد.)
 */
const PASSWORD_MAX_BYTES_FA = PASSWORD_MAX_BYTES.toLocaleString("fa-IR");

/**
 * این فایل هم سمت سرور و هم داخل فرم‌های کلاینت (react-hook-form) ایمپورت
 * می‌شود، پس نباید به APIهای Node تکیه کند. Buffer در مرورگر وجود ندارد،
 * ولی TextEncoder در هر دو محیط هست و برای UTF-8 همان شمارش بایت را می‌دهد.
 */
function byteLength(value: string): number {
  return new TextEncoder().encode(value).length;
}

const password = z
  .string()
  .min(8, { error: "رمز عبور باید حداقل ۸ کاراکتر باشد" })
  .refine((value) => byteLength(value) <= PASSWORD_MAX_BYTES, {
    error: `رمز عبور نباید بیشتر از ${PASSWORD_MAX_BYTES_FA} بایت باشد`,
  });

// در Zod 4 اعتبارسنجی ایمیل در ریشهٔ API است: z.email() (نه z.string().email() که منسوخ شده).
const email = z.email({ error: "ایمیل معتبر نیست" }).max(254, {
  error: "ایمیل بیش از حد طولانی است",
});

export const registerSchema = z.object({
  email,
  password,
  displayName: z
    .string()
    .trim()
    .max(80, { error: "نام نمایشی نباید بیشتر از ۸۰ کاراکتر باشد" })
    .optional(),
  timezone: z.string().trim().max(64).optional(),
});

// در لاگین فقط طول ۱ لازم است: اعتبارسنجی سخت‌گیرانهٔ رمز اینجا
// اطلاعاتی دربارهٔ قوانین ثبت‌نام لو می‌دهد.
export const loginSchema = z.object({
  email,
  password: z.string().min(1, { error: "رمز عبور را وارد کنید" }),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

/**
 * یکسان‌سازی ایمیل. قید @unique در Postgres به‌صورت پیش‌فرض حساس به
 * بزرگی/کوچکی حروف است، پس اگر این کار را نکنیم Alice@x.com و
 * alice@x.com دو کاربر جدا می‌شدند و ورودشان مبهم می‌شد.
 */
export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}
