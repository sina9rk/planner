import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/ui";
import { requirePersona } from "@/lib/guards";
import { PATHS } from "@/lib/flow";
import { prisma } from "@/lib/prisma";
import { AdvisorChat } from "../advisor-chat";

export const metadata = { title: "مشاور | برنامه‌ریز" };

export default async function GoalAdvisorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requirePersona();

  const goal = await prisma.goal.findFirst({
    where: { id, userId: user.id },
    select: { id: true, title: true },
  });
  if (!goal) notFound();

  return (
    <AppShell title="مشاور برنامه‌ریزی">
      <Link href={`${PATHS.goals}/${goal.id}`} className="mb-3 text-xs text-muted">
        ← بازگشت به هدف
      </Link>
      <AdvisorChat goalTitle={goal.title} />
    </AppShell>
  );
}
