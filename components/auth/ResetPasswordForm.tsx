"use client";

import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { updatePassword } from "@/lib/auth/actions";
import { createClient } from "@/lib/supabase/client";

const initialState = { error: "" };

export default function ResetPasswordForm() {
  const [ready, setReady] = useState(false);
  const [state, formAction, pending] = useActionState(
    async (_prev: typeof initialState, formData: FormData) => {
      const result = await updatePassword(formData);
      return { error: result?.error ?? "" };
    },
    initialState
  );

  useEffect(() => {
    const supabase = createClient();

    void supabase.auth.getSession().then(({ data: { session } }) => {
      setReady(Boolean(session));
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) {
        setReady(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  if (!ready) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-sm leading-relaxed text-slate-400">
          Open the reset link from your email to choose a new password.
        </p>
        <Link
          href="/forgot-password"
          className="inline-block text-sm text-violet-400/90 transition hover:text-violet-300"
        >
          Request a new link
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-5">
      <Input
        label="New password"
        name="password"
        type="password"
        autoComplete="new-password"
        placeholder="At least 8 characters"
        required
      />

      <Input
        label="Confirm password"
        name="confirmPassword"
        type="password"
        autoComplete="new-password"
        placeholder="Repeat your password"
        required
      />

      {state?.error ? (
        <p className="text-sm text-red-400" role="alert">
          {state.error}
        </p>
      ) : null}

      <Button type="submit" className="w-full" loading={pending}>
        Update password
      </Button>
    </form>
  );
}
