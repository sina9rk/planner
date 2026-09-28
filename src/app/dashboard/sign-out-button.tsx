"use client";

import { useState, useTransition } from "react";
import { signOut } from "next-auth/react";

export function SignOutButton() {
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState(false);

  const loading = pending || busy;

  return (
    <button
      type="button"
      disabled={loading}
      // در این نسخهٔ بتای Auth.js ‏callbackUrl منسوخ است و redirectTo
      // جایگزین آن شده.
      onClick={() => {
        setBusy(true);
        startTransition(() => {
          void signOut({ redirectTo: "/login" });
        });
      }}
      className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm transition hover:bg-zinc-100 disabled:opacity-60 dark:border-zinc-700 dark:hover:bg-zinc-800"
    >
      {loading ? "در حال خروج…" : "خروج از حساب"}
    </button>
  );
}
