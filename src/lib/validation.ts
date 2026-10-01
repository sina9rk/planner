import { z } from "zod";

/**
 * اعتبارسنجی مشترک بین فرم‌ها و Server Action. عمداً همان schema در هر دو
 * طرف استفاده می‌شود: اگر سمت کلاینت و سرور جدا باشند، یکی از آنها فراموش
 * می‌شود و یا پیام متفاوتی نشان می‌دهد.
 */

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * رمز را به بایت UTF-8 اندازه می‌گیریم نه به کاراکتر. bcrypt روی بایت کار
 * می‌کند، پس هش برش بر اساس کاراکتر اشتباه می‌شود: یک رمز ۷۳ کاراکتری فارسی
 * می‌تواند بیش از ۷۲ بایت باشد و بی‌سروصدا برش بخورد.
 */
const PASSWORD_MAX_BYTES = 72;

export const loginSchema = z.object({
  email: z.email("ایمیل معتبر نیست.").max(254, "ایمیل خیلی بلند است."),
  password: z.string().min(1, "رمز عبور را وارد کنید."),
});

export const registerSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(2, "اسم باید حداقل ۲ کاراکتر باشد.")
    .max(60, "اسم حداکثر ۶۰ کاراکتر است."),
  email: z.email("ایمیل معتبر نیست.").max(254, "ایمیل خیلی بلند است."),
  password: z
    .string()
    .min(8, "رمز عبور باید حداقل ۸ کاراکتر باشد.")
    .refine(
      (value) => Buffer.byteLength(value, "utf8") <= PASSWORD_MAX_BYTES,
      "رمز عبور حداکثر ۷۲ بایت است.",
    ),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
