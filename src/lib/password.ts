import { compare, hash } from "bcryptjs";

export const BCRYPT_ROUNDS = 12;

/**
 * bcrypt بیشتر از ۷۲ بایت ورودی را بی‌صدا برش می‌دهد. این یعنی دو رمز که فقط
 * در چند کاراکتر آخر فرق دارند یک هش می‌شدند و کسی می‌توانست با یک رمزِ
 * ۷۲ بایتی به حسابی که رمز بلندتری دارد وارد شود. برای همین ورودی را قبل از
 * هش کردن برش می‌دهیم، ولی بی‌سروصدا نه: تابع زیر اگر ورودی بلندتر باشد خطا
 * می‌دهد تا لایهٔ بالاتر مجبور شود کاربر را مطلع کند.
 */
export const BCRYPT_MAX_BYTES = 72;

export function byteLength(value: string): number {
  return Buffer.byteLength(value, "utf8");
}

/**
 * هش bcrypt با cost=12. کاربر در ثبت‌نام حدود نیم ثانیه معطلی می‌بیند که در
 * عوض ذخیرهٔ هش گران می‌شود.
 *
 * cost قابل تنظیم است چون تست‌ها با cost پایین اجرا می‌شوند تا کند نشوند.
 * در مسیر واقعی همیشه BCRYPT_ROUNDS استفاده می‌شود.
 */
export function hashPassword(
  password: string,
  rounds: number = BCRYPT_ROUNDS,
): Promise<string> {
  return hash(password, rounds);
}

/**
 * یک هش ساختگی که هیچ رمزی به آن نمی‌خورد. وقتی کاربر پیدا نشد، compare با
 * این هش اجرا می‌شود تا زمان پاسخ تقریباً ثابت بماند؛ وگرنه یک کاربر غایب
 * سریع‌تر جواب می‌گیرد و از تفاوت زمان می‌شود فهمید ایمیل ثبت شده یا نه.
 */
const DUMMY_HASH =
  "$2b$12$V8CqgqLynH/65ddjjrucfuGmYuVV6sEdP03nP/qNJVof1A0uIPRzC";

export async function verifyPassword(
  password: string,
  passwordHash: string | null | undefined,
): Promise<boolean> {
  if (!passwordHash) {
    await compare(password, DUMMY_HASH);
    return false;
  }
  return compare(password, passwordHash);
}
