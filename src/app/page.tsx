import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { track } from "@/lib/track";
import { readPersonas } from "@/lib/personas";
import { afterAuth } from "@/lib/flow";

export const metadata = { title: "برنامه‌ریز" };

/**
 * نقطهٔ ورود بعد از auth. تصمیم این‌که کاربر برود آنبوردینگ یا داشبورد در
 * lib/flow گرفته می‌شود، چون همان تصمیم در اکشن‌های ثبت‌نام و ورود هم لازم
 * است.
 *
 * این صفحه همیشه dynamic است چون auth() کوکی را می‌خواند.
 */
export default async function HomePage() {
  const session = await auth();
  if (!session?.user?.email) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, personaId: true },
  });

  // باز شدن اپ یک اکشن کاربر است و باید ثبت شود. اگر کاربر پیدا نشود (مثلاً
  // نشست از دیتابیس دیگری آمده) track چیزی ثبت نمی‌کند چون userId خالی است.
  if (user) {
    await track(user.id, "app_opened", { entry: "/" });
  }

  // اگر personaId ذخیره شده ولی دیگر در فایل پیکربندی نباشد، کاربر را به
  // مرحله‌ای که نتیجه‌ای ندارد رها نمی‌کنیم؛ دوباره آنبوردینگ را نشان می‌دهیم.
  const personas = await readPersonas();
  const personaExists = personas.some((persona) => persona.id === user?.personaId);

  redirect(afterAuth(Boolean(user?.personaId) && personaExists));
}
