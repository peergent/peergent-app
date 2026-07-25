import { redirect } from "next/navigation";
import { peerStudioHref } from "@/lib/config/peer-studio";

type MarketingRedirectPageProps = {
  params: Promise<{ id: string }>;
};

/** Legacy marketing workspace — redirects to Peer Studio. */
export default async function MarketingRedirectPage({ params }: MarketingRedirectPageProps) {
  const { id } = await params;
  redirect(peerStudioHref(id));
}
