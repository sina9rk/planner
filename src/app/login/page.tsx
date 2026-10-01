import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { FormCard, PageShell, WaveHeader } from "@/components/ui";
import { LoginForm } from "./login-form";

export const metadata = { title: "ورود | برنامه‌ریز" };

export default async function LoginPage() {
  // اگر کسی که وارد شده صفحهٔ ورود را باز کند، فرم بی‌معنی است.
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  return (
    <PageShell>
      <WaveHeader title="ورود" subtitle="ادامه بده همون‌جایی که موندی" mark="م" />

      <FormCard>
        <LoginForm />

        <div className="mt-5 flex items-center gap-2.5 text-[11px] text-muted">
          <span className="h-px flex-1 bg-line" />
          یا
          <span className="h-px flex-1 bg-line" />
        </div>

        {/* دکمهٔ گوگل در مرجع طراحی هست ولی طبق تصمیم فعلاً فعال نیست: provider
            گوگل در auth.ts تعریف نشده و اگر به آن لینک بدهیم، خطای
            configuration می‌دهی. وقتی GOOGLE_CLIENT_ID و GOOGLE_CLIENT_SECRET
            اضافه شد، این دکمه به signIn("google") وصل می‌شود. */}
        <p className="rounded-xl border border-line px-3 py-2.5 text-center text-xs text-muted">
          ورود با گوگل — به‌زودی
        </p>

        <p className="mt-auto pt-6 text-center text-xs text-muted">
          حساب نداری؟{" "}
          <Link href="/register" className="font-medium text-accent">
            ثبت‌نام کن
          </Link>
        </p>
      </FormCard>
    </PageShell>
  );
}
