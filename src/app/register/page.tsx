import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { FormCard, PageShell, WaveHeader } from "@/components/ui";
import { RegisterForm } from "./register-form";

export const metadata = { title: "ثبت‌نام | برنامه‌ریز" };

export default async function RegisterPage() {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  return (
    <PageShell>
      <WaveHeader
        title="ثبت‌نام"
        subtitle="دو دقیقه وقت می‌گیرد و بعد شروع می‌کنیم"
        mark="م"
      />

      <FormCard>
        <RegisterForm />
      </FormCard>
    </PageShell>
  );
}
