"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  FormAlert,
  PasswordField,
  SubmitButton,
  TextField,
} from "@/components/form";
import {
  normalizeEmail,
  registerSchema,
  type RegisterInput,
} from "@/lib/validation";

const PASSWORD_MAX_BYTES = 72;

// فقط فیلدهایی که واقعاً در فرم رندر می‌شوند؛ setError روی فیلدِ ثبت‌نشده
// بی‌معنی است.
const RENDERED_FIELDS = ["displayName", "email", "password"] as const;
type RenderedField = (typeof RENDERED_FIELDS)[number];

function isRenderedField(name: string): name is RenderedField {
  return (RENDERED_FIELDS as readonly string[]).includes(name);
}

type FieldErrors = Record<string, string[] | undefined>;

export function RegisterForm() {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const [created, setCreated] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    control,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { email: "", password: "", displayName: "" },
  });

  // watch() به‌ازای هر کلید کل کامپوننت را re-render می‌کند و با React
  // Compiler سازگار نیست؛ useWatch فقط همین فیلد را مشترک می‌کند.
  const passwordValue = useWatch({ control, name: "password" });
  const usedBytes = new TextEncoder().encode(passwordValue ?? "").length;
  // پیام‌های اعتبارسنجی ارقام فارسی دارند، پس شمارنده هم باید فارسی باشد
  // وگرنه کنار هم ناهماهنگ دیده می‌شوند.
  const usedBytesFa = usedBytes.toLocaleString("fa-IR");

  async function onSubmit(values: RegisterInput) {
    setFormError(null);
    setCreated(false);

    const email = normalizeEmail(values.email);

    let response: Response;
    try {
      response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password: values.password,
          // رشتهٔ خالی یعنی «نگرفته» و باید به سرور فرستاده نشود، وگرنه
          // min(1) اسکیمای سرور آن را رد می‌کند.
          displayName: values.displayName?.trim() || undefined,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        }),
      });
    } catch {
      setFormError("ارتباط با سرور برقرار نشد. اتصال اینترنت را بررسی کنید.");
      return;
    }

    if (response.status === 409) {
      setError("email", {
        type: "server",
        message: "این ایمیل قبلاً ثبت شده است.",
      });
      return;
    }

    if (response.status === 422) {
      // اعتبارسنجی سمت سرور تکرارِ همان قوانین سمت کلاینت است، ولی
      // مرجع نهایی است؛ خطاها را روی همان فیلدها می‌نشانیم.
      const details = (await response.json().catch(() => null)) as {
        details?: { fieldErrors?: FieldErrors };
      } | null;

      const fieldErrors = details?.details?.fieldErrors ?? {};
      let mapped = false;
      for (const [field, messages] of Object.entries(fieldErrors)) {
        if (isRenderedField(field) && messages?.[0]) {
          setError(field, { type: "server", message: messages[0] });
          mapped = true;
        }
      }
      if (!mapped) setFormError("اطلاعات وارد شده معتبر نیست.");
      return;
    }

    if (!response.ok) {
      setFormError("ثبت‌نام ناموفق بود. لطفاً دوباره تلاش کنید.");
      return;
    }

    // ثبت‌نام موفق: بلافاصله هم وارد می‌کنیم تا کاربر یک قدم اضافه
    // (دوباره تایپ کردن رمز) انجام ندهد.
    const result = await signIn("credentials", {
      email,
      password: values.password,
      redirect: false,
    });

    if (result?.error) {
      // حساب ساخته شده اما ورود خودکار نشد؛ کاربر باید دستی وارد شود.
      setCreated(true);
      setFormError("حساب ساخته شد، ولی ورود خودکار انجام نشد. لطفاً وارد شوید.");
      router.push("/login");
      return;
    }

    router.replace("/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
      <FormAlert>
        {formError}
        {created ? (
          <Link href="/login" className="ms-2 font-medium underline">
            رفتن به صفحهٔ ورود
          </Link>
        ) : null}
      </FormAlert>

      <TextField
        label="نام نمایشی (اختیاری)"
        autoComplete="name"
        error={errors.displayName?.message}
        {...register("displayName")}
      />

      <TextField
        label="ایمیل"
        type="email"
        autoComplete="email"
        inputMode="email"
        dir="ltr"
        placeholder="you@example.com"
        error={errors.email?.message}
        {...register("email")}
      />

      <PasswordField
        label="رمز عبور"
        autoComplete="new-password"
        error={errors.password?.message}
        hint={
          <span className={usedBytes > PASSWORD_MAX_BYTES ? "text-red-600 dark:text-red-400" : undefined}>
            {usedBytesFa} از {PASSWORD_MAX_BYTES.toLocaleString("fa-IR")} بایت
            {usedBytes > PASSWORD_MAX_BYTES
              ? " — این سقف به‌خاطر محدودیت bcrypt است و حروف فارسی هر کدام ۲ بایت حساب می‌شوند."
              : ""}
          </span>
        }
        {...register("password")}
      />

      <SubmitButton isSubmitting={isSubmitting}>ساخت حساب</SubmitButton>

      <p className="text-center text-sm text-zinc-500">
        قبلاً ثبت‌نام کرده‌اید؟{" "}
        <Link href="/login" className="font-medium text-zinc-900 underline dark:text-zinc-100">
          وارد شوید
        </Link>
      </p>
    </form>
  );
}
