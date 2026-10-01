import { redirect } from "next/navigation";
import Link from "next/link";
import { AppShell, InfoBox } from "@/components/ui";
import { requirePersona } from "@/lib/guards";
import { PATHS } from "@/lib/flow";
import { findPersona } from "@/lib/personas";

export const metadata = { title: "نتیجه | برنامه‌ریز" };

/**
 * نتیجهٔ پرسونا (مرحلهٔ ۲). خودِ محاسبه در اکشن آخر سؤال انجام شده و
 * User.personaId ذخیره شده، پس این صفحه فقط نمایش است و هیچ نوشتنی ندارد.
 *
 * اگر پرسونا نباشد به آنبوردینگ برمی‌گردد، نه این‌که صفحهٔ خالی نشان دهد.
 */
export default async function PersonaPage() {
  const user = await requirePersona();
  const persona = await findPersona(user.personaId);
  if (!persona) redirect(PATHS.onboarding);

  const firstName = user.displayName?.trim().charAt(0) || user.email.charAt(0);

  return (
    <AppShell title={`نتیجهٔ ${firstName}`}>
      <p className="mb-3 text-[12px] font-bold text-accent">نتیجهٔ تو</p>

      <h2 className="mb-2 text-[22px] font-bold">{persona.name}</h2>
      <p className="mb-4 text-[13px] text-muted">{persona.tagline}</p>

      {/* سه کارت برنامهٔ تو؛ همان ساختار .box در مرجع طراحی. */}
      <InfoBox title="برنامهٔ تو">{persona.plan}</InfoBox>
      <InfoBox title="لحن پیام‌ها">{persona.toneNote}</InfoBox>
      <InfoBox title="وقتی از برنامه جا افتادی">{persona.missedDayPolicy}</InfoBox>

      <p className="mt-1 mb-4 text-[13px] text-muted">
        هر وقت خواستی می‌توانی این را از پروفایل عوض کنی.
      </p>

      <Link
        href={PATHS.goals}
        className="block rounded-[14px] bg-accent px-3 py-3 text-center text-sm font-bold text-ink"
      >
        بریم سراغ اهدافم
      </Link>
    </AppShell>
  );
}
