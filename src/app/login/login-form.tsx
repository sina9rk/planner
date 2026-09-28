"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Alert, Button, Form, Input } from "antd";

import { loginSchema, normalizeEmail, type LoginInput } from "@/lib/validation";

function safeCallback(raw: string | null): string {
  if (raw && raw.startsWith("/") && !raw.startsWith("//")) {
    return raw;
  }

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
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: LoginInput) {
    setFormError(null);

    const result = await signIn("credentials", {
      email: normalizeEmail(values.email),
      password: values.password,
      redirect: false,
    });

    if (result?.error) {
      setFormError("ایمیل یا رمز عبور درست نیست.");
      return;
    }

    router.replace(safeCallback(searchParams.get("callbackUrl")));

    router.refresh();
  }

  return (
    <Form
      layout="vertical"
      onFinish={handleSubmit(onSubmit)}
      requiredMark={false}
      dir="rtl"
    >
      {formError && (
        <Alert
          type="error"
          message={formError}
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      <Form.Item
        label="ایمیل"
        validateStatus={errors.email ? "error" : ""}
        help={errors.email?.message}
      >
        <Input
          {...register("email")}
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          inputMode="email"
          dir="ltr"
          size="large"
          variant="underlined"
        />
      </Form.Item>

      <Form.Item
        label="رمز عبور"
        validateStatus={errors.password ? "error" : ""}
        help={errors.password?.message}
      >
        <Input.Password
          {...register("password")}
          placeholder="رمز عبور"
          autoComplete="current-password"
          size="large"
        />
      </Form.Item>

      <Button
        type="primary"
        htmlType="submit"
        loading={isSubmitting}
        size="large"
        block
      >
        ورود
      </Button>

      <p className="mt-4 text-center text-sm text-zinc-500">
        حساب ندارید؟{" "}
        <Link href="/register" className="font-medium text-zinc-900 underline">
          ثبت‌نام کنید
        </Link>
      </p>
    </Form>
  );
}
