"use client";

import Link from "next/link";
import { useActionState } from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { requestPasswordReset } from "@/lib/auth/actions";

const initialState = { error: "", success: false as boolean, email: "" };

export default function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState(
    async (_prev: typeof initialState, formData: FormData) => {
      const result = await requestPasswordReset(formData);
      return { ...initialState, ...result };
    },
    initialState
  );

  if (state?.success && state.email) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-sm leading-relaxed text-slate-400">
          If an account exists for{" "}
          <span className="font-medium text-white">{state.email}</span>, we sent
          a reset link.
        </p>
        <Link
          href="/login"
          className="inline-block text-sm text-violet-400/90 transition hover:text-violet-300"
        >
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-5">
      <Input
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        placeholder="you@company.com"
        required
      />

      {state?.error ? (
        <p className="text-sm text-red-400" role="alert">
          {state.error}
        </p>
      ) : null}

      <Button type="submit" className="w-full" loading={pending}>
        Send reset link
      </Button>
    </form>
  );
}
