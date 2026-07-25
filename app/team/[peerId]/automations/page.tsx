import { redirect } from "next/navigation";

type TeamPeerAutomationsPageProps = {
  params: Promise<{ peerId: string }>;
};

export default async function TeamPeerAutomationsPage({ params }: TeamPeerAutomationsPageProps) {
  const { peerId } = await params;
  redirect(`/team/${peerId}/responsibilities`);
}
