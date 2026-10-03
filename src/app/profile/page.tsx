import { redirect } from "next/navigation";
import { UserIcon } from "lucide-react";
import { AppShell, Bar, InfoRow, StatTile } from "@/components/ui";
import { requirePersona } from "@/lib/guards";
import { PATHS } from "@/lib/flow";
import { findPersona } from "@/lib/personas";
import { prisma } from "@/lib/prisma";
import { faNum, faPercent, faTime } from "@/lib/fa";
import { startOfWeek } from "@/lib/goals";
import { normalizeAccent, normalizeThemeMode } from "@/lib/theme";
import { restartOnboardingAction } from "@/lib/actions/onboarding";
import { signOutAction } from "@/lib/actions/auth";
import { ThemeSection } from "./theme-section";

export const metadata = { title: "پروفایل | Planner" };

async function getProfileStats(userId: string) {
  const now = new Date();

  const goalLogs = await prisma.goalLog.findMany({
    where: { userId },
    select: { loggedAt: true },
  });

  const [completedTasks, allTasks, activeGoals] = await Promise.all([
    prisma.task.count({
      where: { userId, status: "COMPLETED", parentTaskId: null },
    }),
    prisma.task.count({
      where: { userId, parentTaskId: null },
    }),
    prisma.goal.count({
      where: { userId, active: true },
    }),
  ]);

  const activeDaysSet = new Set<string>();

  for (const log of goalLogs) {
    const d = log.loggedAt;
    activeDaysSet.add(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`);
  }

  const sinceWeek = startOfWeek(now);

  const weekCompletedTasks = await prisma.task.findMany({
    where: {
      userId,
      status: "COMPLETED",
      parentTaskId: null,
      completedAt: { gte: sinceWeek },
    },
    select: { completedAt: true },
  });

  for (const t of weekCompletedTasks) {
    if (t.completedAt) {
      const d = t.completedAt;
      activeDaysSet.add(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`);
    }
  }

  const activeDays = activeDaysSet.size;
  const completionPct = allTasks === 0 ? 0 : Math.round((completedTasks / allTasks) * 100);

  return {
    activeDays,
    completionPct,
    activeGoals,
    completedTasks,
    allTasks,
  };
}

export default async function ProfilePage() {
  const user = await requirePersona();
  const persona = await findPersona(user.personaId);
  if (!persona) redirect(PATHS.onboarding);

  const stats = await getProfileStats(user.id);
  const displayName = user.displayName?.trim() || user.email.split("@")[0];

  return (
    <AppShell title="پروفایل">
      <section className="relative -mx-4 flex flex-col items-center bg-gradient-to-bl from-[#111826] to-bg px-4 pt-7 pb-10">
        {/* خروج در گوشهٔ بالا-چپ هدر، چون دست اصلی کاربر در اپ گوشهٔ پایین
            است و این تنها جایی است که به آن دست نمی‌خورد. */}
        <form action={signOutAction} className="absolute top-4 left-4">
          <button
            type="submit"
            className="rounded-xl border border-line bg-surface/60 px-3 py-2 text-xs text-text transition hover:bg-raised"
          >
            خروج
          </button>
        </form>

        {/* آواتار: فعلاً آپلود تصویر نداریم، ولی دایرهٔ خط‌چین جای خالیِ
            آپلود را صریح نشان می‌دهد تا بعداً پر شدنش بدیهی باشد. */}
        <div className="grid h-20 w-20 place-items-center rounded-full border-dashed border-line text-muted">
          <UserIcon className="size-8" />
        </div>

        <h2 className="mt-3 text-base font-bold">{displayName}</h2>
        <p className="mt-1 text-xs text-accent">{persona.name}</p>
      </section>

      <div className="space-y-6 pt-6 pb-10">
        <section>
          <h3 className="mb-3 text-sm font-medium text-muted">آمار کلی</h3>
          <div className="grid grid-cols-3 gap-2">
            <StatTile value={faNum(stats.activeDays)} label="روز فعال" />
            <StatTile value={faPercent(stats.completionPct / 100)} label="تکمیل" />
            <StatTile value={faNum(stats.activeGoals)} label="هدف فعال" />
          </div>
        </section>

        <section>
          <h3 className="mb-3 text-sm font-medium text-muted">محورهای شخصیتی</h3>
          <div className="space-y-3 rounded-2xl border border-line bg-surface p-4">
            <div>
              <div className="mb-2 flex items-center justify-between text-xs text-muted">
                <span>تمرکز</span>
                <span>{faNum(Math.round(persona.traitAxis.focus * 100))}</span>
              </div>
              <Bar percent={Math.round(persona.traitAxis.focus * 100)} />
            </div>
            <div>
              <div className="mb-2 flex items-center justify-between text-xs text-muted">
                <span>ساختار</span>
                <span>{faNum(Math.round(persona.traitAxis.structure * 100))}</span>
              </div>
              <Bar percent={Math.round(persona.traitAxis.structure * 100)} />
            </div>
            <div>
              <div className="mb-2 flex items-center justify-between text-xs text-muted">
                <span>فشارمحور</span>
                <span>{faNum(Math.round(persona.traitAxis.pressureDriven * 100))}</span>
              </div>
              <Bar percent={Math.round(persona.traitAxis.pressureDriven * 100)} />
            </div>
          </div>
        </section>

        <ThemeSection
          initialAccent={normalizeAccent(user.themeAccent)}
          initialMode={normalizeThemeMode(user.themeMode)}
        />

        <section>
          <h3 className="mb-1 text-sm font-medium text-muted">تنظیمات</h3>
          <p className="mb-1 text-xs text-muted">
            لحن پیام‌ها و ساعت یادآوری از گروه شخصیتی تو می‌آید.
          </p>
          <div className="rounded-2xl border border-line bg-surface px-3.5">
            <InfoRow label="ایمیل" value={user.email} />
            <InfoRow label="ساعت یادآوری" value={faTime(persona.suggestedReminderTime)} />
            <InfoRow
              label="لحن پیام‌ها"
              value={persona.toneStyle === "commander" ? "مستقیم و قاطع" : "آرام و دوستانه"}
            />
          </div>
        </section>

        <section>
          <form action={restartOnboardingAction}>
            <button
              type="submit"
              className="block w-full rounded-xl border border-line px-3 py-3 text-center text-sm text-text transition hover:bg-raised"
            >
              انجام دوباره‌ی سؤال‌های شخصیتی
            </button>
          </form>
        </section>
      </div>
    </AppShell>
  );
}
