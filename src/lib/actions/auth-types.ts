/**
 * تایپ‌های اکشن‌های احراز هویت. جدا از فایل "use server" نگه داشته شده چون
 * یک فایل server action فقط اجازهٔ export کردن تابع async دارد؛ تایپ‌ها باید
 * در فایل جدا باشند.
 */

export type AuthState = {
  error: string;
  /** خطای هر فیلد جدا از خطای عمومی، تا فرم کنار هر input نشان دهد. */
  fieldErrors?: Partial<Record<"email" | "password", string>>;
} | null;

export type RegisterState = {
  error: string;
  /** خطای هر فیلد جدا از خطای عمومی، تا فرم کنار هر input نشان دهد. */
  fieldErrors?: Partial<Record<"displayName" | "email" | "password", string>>;
} | null;
