import Link from "next/link";
import { AppShell } from "@/components/ui";
import { requirePersona } from "@/lib/guards";
import { PATHS } from "@/lib/flow";
import { GoalForm } from "./goal-form";

export const metadata = { title: "هدف جدید | برنامه‌ریز" };

export default async function NewGoalPage() {
  await requirePersona();
  return (
    <AppShell title="هدف جدید">
      <Link href={PATHS.goals} className="mb-4 text-xs text-muted">
        ← بازگشت
      </Link>
      <GoalForm />
    </AppShell>
  );
}
