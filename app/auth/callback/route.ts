import { NextResponse } from "next/server";
import { getSafeNextPath } from "@/lib/auth/next-path";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const rawNext = searchParams.get("next");
  const safeNext = getSafeNextPath(rawNext);

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      if (safeNext) {
        return NextResponse.redirect(`${origin}${safeNext}`);
      }

      return NextResponse.redirect(`${origin}/auth/post-login`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
