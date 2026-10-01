"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { Field, inputClass, primaryButtonClass } from "@/components/ui";
import { registerAction } from "@/lib/actions/auth";
import type { RegisterState } from "@/lib/actions/auth-types";

function SubmitButton() {
  // pending از useFormStatus خوانده می‌شود نه از prop، چون باید داخل فرم واقعی
  // باشد تا به همان فرم وصل شود و وضعیت را نشان دهد.
  const { pending } = useFormStatus();

  return (
    <button type="submit" disabled={pending} className={primaryButtonClass}>
      {pending ? "در حال ساخت حساب…" : "ساخت حساب"}
    </button>
  );
}

export function RegisterForm() {
  const [state, formAction] = useActionState<RegisterState, FormData>(
    registerAction,
    null,
  );

  return (
    // noValidate: اعتبارسنجی با zod داخل Server Action انجام می‌شود و پیام
    // فارسی برمی‌گرداند. بدون این، مرورگر با type="email" خودش جلوی submit
    // را می‌گیرد و یک تولتیپ انگلیسی نشان می‌دهد.
    <form action={formAction} noValidate>
      {state?.error ? (
        <p
          role="alert"
          className="mb-4 rounded-xl border border-line bg-raised px-3 py-2.5 text-sm text-warn"
        >
          {state.error}
        </p>
      ) : null}

      <Field
        id="register-display-name"
        label="اسمت"
        error={state?.fieldErrors?.displayName}
      >
        <input
          id="register-display-name"
          name="displayName"
          type="text"
          autoComplete="name"
          placeholder="مثلاً سینا"
          className={inputClass}
          aria-invalid={state?.fieldErrors?.displayName ? true : undefined}
        />
      </Field>

      <Field id="register-email" label="ایمیل" error={state?.fieldErrors?.email}>
        <input
          id="register-email"
          name="email"
          type="email"
          dir="ltr"
          autoComplete="email"
          inputMode="email"
          placeholder="you@example.com"
          className={inputClass}
          aria-invalid={state?.fieldErrors?.email ? true : undefined}
        />
      </Field>

      <Field
        id="register-password"
        label="رمز عبور"
        hint="حداقل ۸ کاراکتر"
        error={state?.fieldErrors?.password}
      >
        <input
          id="register-password"
          name="password"
          type="password"
          autoComplete="new-password"
          placeholder="••••••••"
          className={inputClass}
          aria-invalid={state?.fieldErrors?.password ? true : undefined}
        />
      </Field>

      <SubmitButton />

      <p className="mt-4 text-center text-xs text-muted">
        حساب داری؟{" "}
        <Link href="/login" className="font-medium text-accent">
          وارد شو
        </Link>
      </p>
    </form>
  );
}
