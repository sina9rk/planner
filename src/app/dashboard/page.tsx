import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { signOutAction } from "@/lib/actions/auth";
import { readPersonas } from "@/lib/personas";
import { findUserByEmail } from "@/services/users";
import { AppShell } from "@/components/ui";

export const metadata = { title: "داشبورد | برنامه‌ریز" };

/**
 * در این مرحله فقط اسکلت لازم است تا مسیر کاربر قابل تست باشد. محتوای واقعی
 * داشبورد در مرحلهٔ ۶ (داشبورد هفتگی) ساخته می‌شود.
 */
export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.email) redirect("/login");

  const user = await findUserByEmail(session.user.email);

  const persona = (await readPersonas()).find((p) => p.id === user?.personaId);

  return (
    <AppShell title="داشبورد">
      <div className="pt-10 pb-10">
        <h1 className="text-xl font-bold">
          داشبورد
        </h1>
        <p className="mt-1 text-sm text-muted">
          خوش آمدید{user?.displayName ? `، ${user.displayName}` : ""}.
        </p>

        <dl className="mt-6 divide-y divide-line rounded-2xl bg-surface text-sm">
          <div className="flex items-center justify-between gap-3 p-4">
            <dt className="text-muted">گروه شخصیتی</dt>
            <dd>{persona?.name ?? "—"}</dd>
          </div>
          <div className="flex items-center justify-between gap-3 p-4">
            <dt className="text-muted">لحن پیام‌ها</dt>
            <dd>{persona?.toneNote ?? "—"}</dd>
          </div>
        </dl>

        <form action={signOutAction} className="mt-6">
          <button
            type="submit"
            className="w-full rounded-xl border border-line px-3 py-3 text-sm transition hover:bg-raised"
          >
            خروج از حساب
          </button>
        </form>
      </div>
    </AppShell>
  );
}
