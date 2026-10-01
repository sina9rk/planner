import type { Session } from "next-auth";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PATHS } from "@/lib/flow";

/**
 * گارد مشترک صفحه‌های داخل اپ.
 *
 * هر صفحهٔ شخصی به این نیاز دارد: نشست را بخوان، کاربر را از دیتابیس بگیر،
 * و اگر نبود به ورود برو. تکرار این ده خط در هر صفحه باعث می‌شد یکی جا بماند
 * و آن صفحه بدون گارد باز بماند.
 *
 * کاربر از روی session خوانده می‌شود نه از client؛ session تنها هویت است،
 * بقیهٔ داده‌ها همیشه باید تازه از دیتابیس خوانده شوند.
 */

export type CurrentUser = {
  id: string;
  email: string;
  displayName: string | null;
  timezone: string;
  personaId: string | null;
  onboardingAnswers: unknown;
  themeAccent: string;
  themeMode: string;
};

export async function requireUser(
  redirectTo: string = PATHS.dashboard,
): Promise<CurrentUser> {
  const session = await auth();
  const email = session?.user?.email;

  if (!email) {
    // next خطای خود Next را می‌دهد، پس صفحه یک‌بار رندر نمی‌شود.
    redirect(redirectTo);
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      displayName: true,
      timezone: true,
      personaId: true,
      onboardingAnswers: true,
      themeAccent: true,
      themeMode: true,
    },
  });

  if (!user) {
    // نشست معتبر است ولی کاربر در دیتابیس نیست (مثلاً دیتابیس ریست شده).
    // این را مثل نبودِ نشست نمی‌بینیم چون اگر چنین باشد بازگشت به ورود بی‌نهایت
    // می‌شد؛ بنابراین نشست را می‌اندازیم.
    redirect(PATHS.login);
  }

  return user;
}

/**
 * گارد مرحله‌هایی که فقط بعد از پرسشنامه معنا دارند. اگر کاربر پرسونا ندارد
 * به مرحلهٔ درست برمی‌گردد، نه این‌که صفحهٔ خالی نشان دهد.
 */
export async function requirePersona(): Promise<CurrentUser> {
  const user = await requireUser();
  if (!user.personaId) redirect(PATHS.onboarding);
  return user;
}

/**
 * شناسهٔ کاربر برای اکشن‌ها. در اکشن‌ها نمی‌شود از requireUser استفاده کرد
 * چون آن تابع redirect می‌کند و redirect داخل اکشن یعنی صفحه به‌جای نمایش
 * پیام خطا می‌پرد؛ در عوض خطا برمی‌گردانیم.
 */
export async function currentUserId(): Promise<string | null> {
  const session: Session | null = await auth();
  return session?.user?.id ?? null;
}
