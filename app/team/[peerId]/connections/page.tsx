import { redirect } from "next/navigation";

type Props = {
  params: Promise<{ peerId: string }>;
};

export default async function ConnectionsRedirectPage({ params }: Props) {
  const { peerId } = await params;
  redirect(`/team/${peerId}/settings?section=connections`);
}
