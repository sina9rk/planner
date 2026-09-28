import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { LoginForm } from "./login-form";

import Wave from "./Wave";

export const metadata = { title: "ورود | برنامه‌ریز" };

// اگر کسی که وارد شده صفحهٔ لاگین را باز کند، فرم بی‌معنی است.
export default async function LoginPage() {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  return (
    <div>
      <Wave />

      <main className=" border-black flex flex-1 flex-col items-center justify-center px-4 py-12">
        <div className=" border-black w-full max-w-sm">
          {/* useSearchParams نیاز به مرز Suspense دارد، وگرنه Next.js
            هنگام prerender این صفحه خطا می‌دهد. */}
          <Suspense
            fallback={
              <div className="h-64 animate-pulse rounded-md bg-zinc-100 dark:bg-zinc-900" />
            }
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
    </div>
  );
}
