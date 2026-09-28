"use client";

import { useId, useState } from "react";

const FIELD_BASE =
  "w-full rounded-md border bg-white px-3 py-2 text-sm text-zinc-900 outline-none " +
  "transition focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60 " +
  "dark:bg-zinc-900 dark:text-zinc-50";

const FIELD_OK = "border-zinc-300 focus:border-zinc-500 focus:ring-zinc-500/20";
const FIELD_ERR = "border-red-500 focus:border-red-500 focus:ring-red-500/30";

type FieldShell = {
  label: string;
  error?: string;
  hint?: React.ReactNode;
  id?: string;
};

function FieldShell({
  label,
  error,
  hint,
  id,
  children,
}: FieldShell & {
  children: (props: {
    id: string;
    "aria-invalid": true | undefined;
    "aria-describedby": string | undefined;
  }) => React.ReactNode;
}) {
  // بدون useId برچسب و اینپوت به هم وصل نمی‌شوند و برچسب روی کلیک
  // focus را جابه‌جا نمی‌کند؛ برای صفحه‌کلید و screen-reader لازم است.
  const autoId = useId();
  const fieldId = id ?? autoId;
  const errorId = `${fieldId}-error`;
  const hintId = `${fieldId}-hint`;
  const describedBy =
    [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(" ") ||
    undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={fieldId} className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
        {label}
      </label>
      {children({
        id: fieldId,
        "aria-invalid": error ? true : undefined,
        "aria-describedby": describedBy,
      })}
      {hint ? (
        <p id={hintId} className="text-xs text-zinc-500 dark:text-zinc-400">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="text-xs text-red-600 dark:text-red-400">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function TextField({
  label,
  error,
  hint,
  id,
  className,
  ...input
}: FieldShell & React.ComponentPropsWithRef<"input">) {
  return (
    <FieldShell label={label} error={error} hint={hint} id={id}>
      {(aria) => (
        <input
          {...input}
          {...aria}
          className={`${FIELD_BASE} ${error ? FIELD_ERR : FIELD_OK} ${className ?? ""}`}
        />
      )}
    </FieldShell>
  );
}

export function PasswordField({
  label,
  error,
  hint,
  id,
  className,
  ...input
}: FieldShell & React.ComponentPropsWithRef<"input">) {
  const [visible, setVisible] = useState(false);

  return (
    <FieldShell label={label} error={error} hint={hint} id={id}>
      {(aria) => (
        // div دور input لازم است تا دکمهٔ نمایش/پنهان‌سازی داخل خودِ فیلد
        // بنشیند؛ position نسبی به input داده می‌شود نه به کل wrapper.
        <div className="relative">
          <input
            {...input}
            {...aria}
            type={visible ? "text" : "password"}
            className={`${FIELD_BASE} ${error ? FIELD_ERR : FIELD_OK} ps-10 pe-3 ${className ?? ""}`}
          />
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            // inset-inline-end یعنی در RTL سمت چپ و در LTR سمت راست.
            className="absolute inset-y-0 end-0 px-3 text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300"
            aria-label={visible ? "پنهان کردن رمز عبور" : "نمایش رمز عبور"}
          >
            {visible ? "پنهان" : "نمایش"}
          </button>
        </div>
      )}
    </FieldShell>
  );
}

export function FormAlert({ children }: { children: React.ReactNode }) {
  if (!children) return null;
  return (
    <p
      role="alert"
      className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300"
    >
      {children}
    </p>
  );
}

export function SubmitButton({
  isSubmitting,
  children,
}: {
  isSubmitting: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="submit"
      disabled={isSubmitting}
      className="w-full rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
    >
      {isSubmitting ? "لطفاً صبر کنید…" : children}
    </button>
  );
}
