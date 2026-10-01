"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Field, inputClass, primaryButtonClass } from "@/components/ui";
import { loginAction } from "@/lib/actions/auth";
import type { AuthState } from "@/lib/actions/auth-types";

function SubmitButton() {
  // pending از useFormStatus خوانده می‌شود نه از prop، چون باید داخل فرم واقعی
  // باشد تا به همان فرم وصل شود.
  const { pending } = useFormStatus();

  return (
    <button type="submit" disabled={pending} className={primaryButtonClass}>
      {pending ? "در حال ورود…" : "ورود"}
    </button>
  );
}

export function LoginForm() {
  const [state, formAction] = useActionState<AuthState, FormData>(loginAction, null);

  return (
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
        id="login-email"
        label="ایمیل"
        error={state?.fieldErrors?.email}
      >
        <input
          id="login-email"
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
        id="login-password"
        label="رمز عبور"
        error={state?.fieldErrors?.password}
      >
        <input
          id="login-password"
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          className={inputClass}
          aria-invalid={state?.fieldErrors?.password ? true : undefined}
        />
      </Field>

      <SubmitButton />
    </form>
  );
}
