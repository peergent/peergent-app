"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { resendVerificationEmail, signUp } from "@/lib/auth/actions";

const initialState = { error: "", success: false as boolean, email: "" };

export default function SignupForm() {
  const [pendingResend, setPendingResend] = useState(false);
  const [state, formAction, pending] = useActionState(
    async (_prev: typeof initialState, formData: FormData) => {
      const result = await signUp(formData);
      return { ...initialState, ...result };
    },
    initialState
  );

  if (state?.success && state.email) {
    return (
      <div className="space-y-5 text-center">
        <p className="text-sm leading-relaxed text-slate-400">
          We sent a verification link to{" "}
          <span className="font-medium text-white">{state.email}</span>. Open it
          to activate your workspace.
        </p>
        <Button
          type="button"
          variant="secondary"
          className="w-full"
          loading={pendingResend}
          onClick={async () => {
            setPendingResend(true);
            await resendVerificationEmail(state.email);
            setPendingResend(false);
          }}
        >
          Resend verification email
        </Button>
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
        label="Full name"
        name="fullName"
        autoComplete="name"
        placeholder="Alex Morgan"
        required
      />

      <Input
        label="Organization"
        name="organizationName"
        autoComplete="organization"
        placeholder="ACME Solar"
        hint="Your company or team name."
        required
      />

      <Input
        label="Work email"
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
        autoComplete="new-password"
        placeholder="At least 8 characters"
        required
      />

      {state?.error ? (
        <p className="text-sm text-red-400" role="alert">
          {state.error}
        </p>
      ) : null}

      <Button type="submit" className="w-full" loading={pending}>
        Create account
      </Button>
    </form>
  );
}
