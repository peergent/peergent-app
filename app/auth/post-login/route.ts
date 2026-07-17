import { redirect } from "next/navigation";
import { resolveAuthenticatedDestination } from "@/lib/auth/post-login";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  redirect(await resolveAuthenticatedDestination(searchParams.get("next")));
}
