"use server";

import { redirect } from "next/navigation";
import { getAuthErrorMessage } from "@/lib/auth/errors";
import { resolveAuthenticatedDestination } from "@/lib/auth/post-login";
import { createClient } from "@/lib/supabase/server";

export type LoginActionState = {
  error: string;
};

export async function loginAction(
  _prevState: LoginActionState,
  formData: FormData
): Promise<LoginActionState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: getAuthErrorMessage(error) };
  }

  redirect(
    await resolveAuthenticatedDestination(String(formData.get("next") ?? ""))
  );
}
