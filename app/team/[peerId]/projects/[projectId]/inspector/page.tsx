import { notFound } from "next/navigation";
import CampaignInspectorPageClient from "./CampaignInspectorPageClient";
import { isDevPlaygroundEnabled } from "@/lib/dev/guards";

export default function CampaignInspectorPage() {
  if (!isDevPlaygroundEnabled()) {
    notFound();
  }

  return <CampaignInspectorPageClient />;
}
