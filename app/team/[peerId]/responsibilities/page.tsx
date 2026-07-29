import { redirect } from "next/navigation";

type Props = {
  params: Promise<{ peerId: string }>;
};

export default async function ResponsibilitiesRedirectPage({ params }: Props) {
  const { peerId } = await params;
  redirect(`/team/${peerId}/settings?section=responsibilities`);
}
