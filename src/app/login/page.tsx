import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { LoginForm } from "./login-form";

export const metadata = { title: "ورود | برنامه‌ریز" };

// اگر کسی که وارد شده صفحهٔ لاگین را باز کند، فرم بی‌معنی است.
export default async function LoginPage() {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          ورود به حساب
        </h1>
        <p className="mt-1 mb-6 text-sm text-zinc-500">
          برای ادامه، ایمیل و رمز عبورتان را وارد کنید.
        </p>

        {/* useSearchParams نیاز به مرز Suspense دارد، وگرنه Next.js
            هنگام prerender این صفحه خطا می‌دهد. */}
        <Suspense
          fallback={<div className="h-64 animate-pulse rounded-md bg-zinc-100 dark:bg-zinc-900" />}
        >
          <LoginForm />
        </Suspense>

        <p className="mt-6 text-center text-sm text-zinc-500">
          <Link href="/" className="underline">
            بازگشت به صفحهٔ اصلی
          </Link>
        </p>
      </div>
    </main>
  );
}
