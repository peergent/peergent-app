"use server";

import { redirect } from "next/navigation";
import { getAuthErrorMessage } from "@/lib/auth/errors";
import { resolveAuthenticatedDestination } from "@/lib/auth/post-login";
import { ensureUserOrganization } from "@/lib/organizations/provision";
import { createClient } from "@/lib/supabase/server";

function getSiteUrl() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
    "http://localhost:3000"
  );
}

export async function signInWithPassword(formData: FormData) {
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

export async function signUp(formData: FormData) {
  const fullName = String(formData.get("fullName") ?? "").trim();
  const organizationName = String(formData.get("organizationName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!fullName || !organizationName || !email || !password) {
    return { error: "All fields are required." };
  }

  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        organization_name: organizationName,
      },
      emailRedirectTo: `${getSiteUrl()}/auth/callback?next=/auth/post-login`,
    },
  });

  if (error) {
    return { error: getAuthErrorMessage(error) };
  }

  if (data.session && data.user) {
    await supabase.from("profiles").upsert({
      id: data.user.id,
      full_name: fullName,
    });

    await ensureUserOrganization(supabase, data.user.id, organizationName);
    redirect(
      await resolveAuthenticatedDestination(String(formData.get("next") ?? ""))
    );
  }

  return { success: true, email };
}

export async function requestPasswordReset(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();

  if (!email) {
    return { error: "Email is required." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${getSiteUrl()}/auth/callback?next=/reset-password`,
  });

  if (error) {
    return { error: getAuthErrorMessage(error) };
  }

  return { success: true, email };
}

export async function updatePassword(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (!password || password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }

  if (password !== confirmPassword) {
    return { error: "Passwords do not match." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    return { error: getAuthErrorMessage(error) };
  }

  redirect(await resolveAuthenticatedDestination(null));
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

export async function resendVerificationEmail(email: string) {
  const supabase = await createClient();
  const { error } = await supabase.auth.resend({
    type: "signup",
    email,
    options: {
      emailRedirectTo: `${getSiteUrl()}/auth/callback?next=/auth/post-login`,
    },
  });

  if (error) {
    return { error: getAuthErrorMessage(error) };
  }

  return { success: true };
}
