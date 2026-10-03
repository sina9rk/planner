"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { track } from "@/lib/track";
import { PATHS } from "@/lib/flow";
import { currentUserId } from "@/lib/guards";
import {
  DEFAULT_ACCENT,
  isValidAccent,
  normalizeAccent,
  normalizeThemeMode,
} from "@/lib/theme";

/**
 * ذخیرهٔ تم اپ (رنگ تأکید + حالت نمایش) از صفحهٔ پروفایل.
 *
 * اکشن به‌جای برگرداندن state، بعد از تغییر revalidate می‌کند. دلیلش این است که
 * تم در layout روی <html> می‌نشیند، پس بدون revalidate انتخاب کاربر تا ناوبری
 * بعدی اعمال نمی‌شد.
 *
 * اعتبارسنجی اینجا حیاتی است: مقدار می‌رود داخل `User.themeAccent` و از آن یک
 * رشتهٔ inline style روی <html> ساخته می‌شود (app/layout.tsx). یک فرم دستکاری‌شده
 * یعنی تزریق CSS از این مسیر.
 */

const themeSchema = z.object({
  accent: z.string().refine(isValidAccent, "رنگ نامعتبر"),
  mode: z.enum(["dark", "light"]),
});

export async function saveThemeAction(formData: FormData) {
  const userId = await currentUserId();
  if (!userId) backToProfile();

  const parsed = themeSchema.safeParse({
    accent: formData.get("accent"),
    mode: formData.get("mode"),
  });

  if (!parsed.success) backToProfile();

  // normalizeAccent/normalizeThemeMode دوباره اعتبارسنجی می‌کنند و حروف بزرگ
  // یکسان می‌دهند، پس دو کاربر با یک رنگ مقدار یکسان در دیتابیس دارند.
  const accent = normalizeAccent(parsed.data.accent);
  const mode = normalizeThemeMode(parsed.data.mode);

  await prisma.user.update({
    where: { id: userId },
    data: { themeAccent: accent, themeMode: mode },
  });

  await track(userId, "theme_changed", { accent, mode });

  revalidatePath(PATHS.profile);
  revalidatePath("/", "layout");
}

/**
 * ریست تم به پیش‌فرض. جدا از saveThemeAction است چون کاربر فقط «برگرداندن» را
 * می‌زند و فرم در آن حالت هیچ ورودی معتبری برای پرکردن ندارد.
 */
export async function resetThemeAction() {
  const userId = await currentUserId();
  if (!userId) backToProfile();

  await prisma.user.update({
    where: { id: userId },
    data: { themeAccent: DEFAULT_ACCENT, themeMode: "dark" },
  });

  await track(userId, "theme_changed", {
    accent: DEFAULT_ACCENT,
    mode: "dark",
  });

  revalidatePath(PATHS.profile);
  revalidatePath("/", "layout");
}

/**
 * ورودی نامعتبر یا نشستِ نبوده نباید کاربر را از صفحهٔ تنظیمات بیرون ببرد؛
 * برمی‌گردد به خودِ پروفایل تا آخرین تم معتبرش را ببیند. redirect داخل اکشن
 * throw می‌شود، پس تابع جدا لازم است تا این مسیر در هر دو اکشن تکرار نشود.
 */
function backToProfile(): never {
  revalidatePath(PATHS.profile);
  redirect(PATHS.profile);
}