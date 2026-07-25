import MarketingStudioPage from "@/features/studio/MarketingStudioPage";

type TeamPeerPageProps = {
  params: Promise<{ peerId: string }>;
};

export default function TeamPeerPage(_props: TeamPeerPageProps) {
  return <MarketingStudioPage />;
}
