import { compare, hash } from "bcryptjs";

export const BCRYPT_ROUNDS = 12;

/**
 * هش bcrypt با cost برابر ۱۲ از یک رمز تصادفی. هیچ‌وقت با رمز واقعی
 * برابر نیست، فقط باعث می‌شود هنگام نبودِ کاربر هم یک compare پرهزینه
 * اجرا شود تا از روی زمان پاسخ نتوان فهمید ایمیل ثبت شده است یا نه.
 */
const DUMMY_HASH =
  "$2b$12$V8CqgqLynH/65ddjjrucfuGmYuVV6sEdP03nP/qNJVof1A0uIPRzC";

export function hashPassword(password: string): Promise<string> {
  return hash(password, BCRYPT_ROUNDS);
}

/**
 * مقایسه‌ی رمز با هش ذخیره‌شده. اگر کاربری وجود نداشته باشد، باز هم
 * compare انجام می‌شود (با DUMMY_HASH) تا زمان پاسخ یکنواخت بماند.
 * در هر دو حالت فقط یک bool برمی‌گردد تا «کاربر نیست» و «رمز غلط است»
 * از بیرون قابل تفکیک نباشد.
 */
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
