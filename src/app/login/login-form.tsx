"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  FormAlert,
  PasswordField,
  SubmitButton,
  TextField,
} from "@/components/form";
import { loginSchema, normalizeEmail, type LoginInput } from "@/lib/validation";

/**
 * Auth.js بعد از نیاز به احراز هویت، ?callbackUrl= را به این صفحه می‌فرستد.
 * فقط مسیر داخلی را قبول می‌کنیم: «//evil.com» با اینکه شبیه مسیر است، در
 * عمل یک URL مطلق است و کاربر را بیرون از سایت می‌برد (open redirect).
 */
function safeCallback(raw: string | null): string {
  if (raw && raw.startsWith("/") && !raw.startsWith("//")) return raw;
  return "/dashboard";
}

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: LoginInput) {
    setFormError(null);

    // redirect:false یعنی به‌جای پرش مرورگر، نتیجه را همین‌جا می‌گیریم
    // تا بتوانیم خطا را داخل فرم نشان دهیم.
    const result = await signIn("credentials", {
      email: normalizeEmail(values.email),
      password: values.password,
      redirect: false,
    });

    if (result?.error) {
      // Auth.js برای «کاربر وجود ندارد» و «رمز غلط» عمداً یک خطای یکسان
      // می‌دهد تا وجودِ ایمیل لو نرود؛ پس پیام واحد نشان می‌دهیم.
      setFormError("ایمیل یا رمز عبور درست نیست.");
      return;
    }

    router.replace(safeCallback(searchParams.get("callbackUrl")));
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
      <FormAlert>{formError}</FormAlert>

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
        autoComplete="current-password"
        error={errors.password?.message}
        {...register("password")}
      />

      <SubmitButton isSubmitting={isSubmitting}>ورود</SubmitButton>

      <p className="text-center text-sm text-zinc-500">
        حساب ندارید؟{" "}
        <Link href="/register" className="font-medium text-zinc-900 underline dark:text-zinc-100">
          ثبت‌نام کنید
        </Link>
      </p>
    </form>
  );
}
