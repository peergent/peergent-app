"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useActionState } from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { signInWithPassword } from "@/lib/auth/actions";

const initialState = { error: "" };

export default function LoginForm() {
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next");
  const verified = searchParams.get("verified") === "1";
  const [state, formAction, pending] = useActionState(
    async (_prev: typeof initialState, formData: FormData) => {
      const result = await signInWithPassword(formData);
      return { error: result?.error ?? "" };
    },
    initialState
  );

  return (
    <form action={formAction} className="space-y-5">
      {nextPath ? <input type="hidden" name="next" value={nextPath} /> : null}

      {verified && (
        <p className="rounded-[14px] border border-emerald-500/20 bg-emerald-500/[0.06] px-4 py-3 text-sm text-emerald-300/90">
          Email verified. You can sign in now.
        </p>
      )}

      <Input
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        placeholder="you@company.com"
        required
      />

      <Input
        label="Password"
        name="password"
        type="password"
        autoComplete="current-password"
        placeholder="Your password"
        required
      />

      {state?.error ? (
        <p className="text-sm text-red-400" role="alert">
          {state.error}
        </p>
      ) : null}

      <div className="flex items-center justify-between gap-3 text-sm">
        <Link
          href="/forgot-password"
          className="text-violet-400/90 transition hover:text-violet-300"
        >
          Forgot password?
        </Link>
      </div>

      <Button type="submit" className="w-full" loading={pending}>
        Sign in
      </Button>
    </form>
  );
}
