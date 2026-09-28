import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { RegisterForm } from "./register-form";

export const metadata = { title: "ثبت‌نام | برنامه‌ریز" };

export default async function RegisterPage() {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          ساخت حساب
        </h1>
        <p className="mt-1 mb-6 text-sm text-zinc-500">
          برای شروع، ایمیل و رمز عبور انتخاب کنید.
        </p>

        <RegisterForm />

        <p className="mt-6 text-center text-sm text-zinc-500">
          <Link href="/" className="underline">
            بازگشت به صفحهٔ اصلی
          </Link>
        </p>
      </div>
    </main>
  );
}
