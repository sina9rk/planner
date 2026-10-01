"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { signIn, signOut } from "@/lib/auth";
import { hashPassword } from "@/lib/password";
import { track } from "@/lib/track";
import { normalizeEmail, registerSchema } from "@/lib/validation";
import { afterLogin, afterRegister } from "@/lib/flow";
import type { AuthState, RegisterState } from "./auth-types";

/**
 * احراز هویت با Server Action، نه route جدا. بریف صریحاً REST را کنار گذاشته و
 * گفته هر مرحله یک برش کامل با API + UI باشد؛ در App Router همان API یعنی
 * Server Action.
 *
 * دربارهٔ track: در این مرحله از مسیر کاربر هنوز session وجود ندارد، پس
 * track صدا زدن ممکن نیست. ثبت رویداد از اولین باز شدن صفحهٔ اصلی (که آنجا
 * session داریم) شروع می‌شود. برای ثبت تلاش‌های ناموفق ورود به یک جدول
 * جداگانهٔ بدون کاربر نیاز داریم که در schema نیست.
 */

/* ---------------------------------------------------------------- ورود */

export async function loginAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  // ایمیل قبل از فرستادن به Auth.js اعتبارسنجی می‌شود تا پیام فارسی خودمان
  // را ببیند. رمز فقط باید خالی نباشد: اعتبارسنجی طول رمز در ورود، کسی را که
  // رمزش قبلاً با قواعد دیگری ساخته شده از حسابش بیرون می‌اندازد.
  const parsed = z
    .object({
      email: z.email("ایمیل معتبر نیست."),
      password: z.string().min(1, "رمز عبور را وارد کنید."),
    })
    .safeParse({
      email: formData.get("email"),
      password: formData.get("password"),
    });

  if (!parsed.success) {
    const fieldErrors: NonNullable<AuthState>["fieldErrors"] = {};
    parsed.error.issues.forEach((issue) => {
      const key = issue.path[0];
      if (key === "email" || key === "password") {
        fieldErrors[key] ??= issue.message;
      }
    });
    return { error: "اطلاعات ورود را بررسی کنید.", fieldErrors };
  }

  const email = normalizeEmail(parsed.data.email);

  // آیا کاربر پرسونا دارد؟ مقصد بعد از ورود به آن بستگی دارد: کسی که
  // پرسشنامه را داده به داشبورد می‌رود و کسی که نداده به آنبوردینگ. این
  // قبلاً داخل catch اتفاق می‌افتاد که یعنی اگر signIn خطا می‌داد، دو کوئری
  // اضافه و بدون استفاده می‌خوردیم.
  const existing = await prisma.user.findUnique({
    where: { email },
    select: { personaId: true },
  });

  try {
    await signIn("credentials", {
      email,
      password: parsed.data.password,
      redirectTo: afterLogin(Boolean(existing?.personaId)),
    });
  } catch (err) {
    // Auth.js برای ورود ناموفق exception می‌اندازد تا redirect اجرا نشود.
    // پیام عمداً عمومی است: تفکیک «کاربر نیست» از «رمز اشتباه است» یک
    // oracle برای حدس زدن ایمیل‌های ثبت‌شده می‌سازد.
    if (isRedirect(err)) throw err;
    console.error("login failed:", err);
    return { error: "ایمیل یا رمز عبور درست نیست." };
  }

  // فقط وقتی می‌رسیم که redirect به هر دلیلی انجام نشده باشد.
  return { error: "ورود انجام نشد." };
}

export async function signOutAction() {
  await signOut({ redirectTo: "/login" });
}

/* ------------------------------------------------------------- ثبت‌نام */

export async function registerAction(
  _prev: RegisterState,
  formData: FormData,
): Promise<RegisterState> {
  const parsed = registerSchema.safeParse({
    displayName: formData.get("displayName"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    const fieldErrors: NonNullable<RegisterState>["fieldErrors"] = {};
    parsed.error.issues.forEach((issue) => {
      const key = issue.path[0];
      if (key === "displayName" || key === "email" || key === "password") {
        fieldErrors[key] ??= issue.message;
      }
    });
    return { error: "اطلاعات ثبت‌نام را بررسی کنید.", fieldErrors };
  }

  const { displayName, password } = parsed.data;
  const email = normalizeEmail(parsed.data.email);

  // بررسی پیشاپیش فقط برای پیام دقیق به کاربر است؛ منبع نهایی محدودیت یکتایی
  // دیتابیس است و در catch هم دوباره چک می‌شود.
  const existing = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });
  if (existing) {
    return {
      error: "این ایمیل قبلاً ثبت شده است.",
      fieldErrors: { email: "این ایمیل قبلاً ثبت شده است." },
    };
  }

  const passwordHash = await hashPassword(password);

  let userId: string;
  try {
    const user = await prisma.user.create({
      data: { email, displayName, passwordHash },
      select: { id: true },
    });
    userId = user.id;
  } catch (err) {
    // P2002 نقض unique. در برابر دو درخواست هم‌زمان محافظت می‌کند.
    if (isUniqueViolation(err)) {
      return {
        error: "این ایمیل قبلاً ثبت شده است.",
        fieldErrors: { email: "این ایمیل قبلاً ثبت شده است." },
      };
    }
    console.error("register failed:", err);
    return { error: "ثبت‌نام انجام نشد. بعداً دوباره تلاش کنید." };
  }

  // ثبت‌نام اولین اکشن قابل ثبتِ این کاربر است، چون از این لحظه userId
  // داریم. رویداد را account_created می‌گذاریم نه app_opened، چون app_opened
  // معنای «باز شدن اپ» دارد و در جدول Event برای تحلیل بازگشت کاربر استفاده
  // می‌شود؛ قاطی کردنش با ثبت‌نام، آمار بازگشت را خراب می‌کند.
  //
  // consentBehaviorLog همین‌جا روشن می‌شود: از این لحظه track رویدادهای رفتاری
  // را شروع می‌کند، پس رضایت باید از قبل ثبت شده باشد.
  await prisma.user.update({
    where: { id: userId },
    data: { consentBehaviorLog: new Date() },
  });
  await track(userId, "account_created", {
    hasDisplayName: Boolean(displayName),
  });

  // کاربر تازه هیچ پرسونایی ندارد، پس مقصدش آنبوردینگ است.
  try {
    await signIn("credentials", { email, password, redirectTo: afterRegister() });
  } catch (err) {
    if (isRedirect(err)) throw err;
    // حساب ساخته شده ولی ورود شکست خورد. کاربر را به ثبت‌نام برنمی‌گردانیم
    // چون ایمیل آزاد است و ثبت‌نام دوباره خطای «ایمیل تکراری» می‌دهد.
    console.error("auto sign-in after register failed:", err);
    return { error: "حساب ساخته شد. حالا وارد شو." };
  }

  return null;
}

function isUniqueViolation(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    (err as { code?: unknown }).code === "P2002"
  );
}

function isRedirect(err: unknown): boolean {
  const digest = (err as { digest?: unknown } | null)?.digest;
  return typeof digest === "string" && digest.startsWith("NEXT_REDIRECT");
}
