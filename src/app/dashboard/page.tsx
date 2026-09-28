import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { SignOutButton } from "./sign-out-button";

export const metadata = { title: "داشبورد | برنامه‌ریز" };

export default async function DashboardPage() {
  // این صفحه با auth() داینامیک می‌شود و در هر درخواست دوباره کوکی
  // بررسی می‌شود، پس محافظت واقعی است و نه فقط پنهان‌کردن لینک.
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <main className="flex flex-1 flex-col gap-6 px-4 py-10">
      <div className="mx-auto w-full max-w-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
              داشبورد
            </h1>
            <p className="mt-1 text-sm text-zinc-500">
              خوش آمدید{session.user.name ? `، ${session.user.name}` : ""}.
            </p>
          </div>
          <SignOutButton />
        </div>

        <dl className="mt-6 divide-y divide-zinc-200 rounded-md border border-zinc-200 text-sm dark:divide-zinc-800 dark:border-zinc-800">
          <div className="flex justify-between gap-4 p-3">
            <dt className="text-zinc-500">نام کاربری</dt>
            <dd dir="ltr" className="font-mono">
              {session.user.name ?? "—"}
            </dd>
          </div>
          <div className="flex justify-between gap-4 p-3">
            <dt className="text-zinc-500">ایمیل</dt>
            <dd dir="ltr" className="font-mono">
              {session.user.email}
            </dd>
          </div>
          <div className="flex justify-between gap-4 p-3">
            <dt className="text-zinc-500">شناسه</dt>
            <dd dir="ltr" className="font-mono text-xs">
              {session.user.id}
            </dd>
          </div>
          <div className="flex justify-between gap-4 p-3">
            <dt className="text-zinc-500">انقضای نشست</dt>
            <dd dir="ltr" className="font-mono text-xs">
              {session.expires}
            </dd>
          </div>
        </dl>

        <p className="mt-6 text-sm text-zinc-500">
          این صفحه فقط نمایشی است تا مطمئن شویم نشست و JWT درست کار می‌کنند.
        </p>
      </div>
    </main>
  );
}
