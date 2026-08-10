/**
 * Resolve CreativeGraph from persisted brain output.
 */

import type { BrainStructuredOutput } from "@/lib/brain/evidence/structured-output";
import type {
  CreativeCampaign,
  CreativeGraph,
  CreativeMessaging,
} from "@/lib/brain/layers/creative/types";

export function resolveCreativeGraph(
  output?: BrainStructuredOutput | null
): CreativeGraph | null {
  if (!output) return null;
  if (output.creativeGraph) return output.creativeGraph;

  const directionFinding = output.findings.find((f) => f.id === "creative-direction");
  if (!directionFinding?.value) return null;

  try {
    const parsed = JSON.parse(directionFinding.value) as Partial<CreativeGraph>;
    if (parsed.version && parsed.phases) return parsed as CreativeGraph;
  } catch {
    return null;
  }

  return null;
}

export function selectedCreativeCampaign(graph: CreativeGraph): CreativeCampaign | null {
  return graph.campaigns.find((c) => c.selected) ?? graph.campaigns[0] ?? null;
}

export function primaryCreativeMessaging(graph: CreativeGraph): CreativeMessaging | null {
  const selected = selectedCreativeCampaign(graph);
  if (!selected) return graph.messaging[0] ?? null;
  return graph.messaging.find((m) => m.campaignId === selected.id) ?? graph.messaging[0] ?? null;
}

export function channelLabel(channel: string, nl: boolean): string {
  const labels: Record<string, { en: string; nl: string }> = {
    linkedin: { en: "LinkedIn", nl: "LinkedIn" },
    google_ads: { en: "Google Ads", nl: "Google Ads" },
    email: { en: "Email", nl: "E-mail" },
    newsletter: { en: "Newsletter", nl: "Nieuwsbrief" },
    landing_page: { en: "Landing page", nl: "Landingspagina" },
    website_landing: { en: "Landing page", nl: "Landingspagina" },
    blog: { en: "Blog", nl: "Blog" },
    instagram: { en: "Instagram", nl: "Instagram" },
    meta_ads: { en: "Meta Ads", nl: "Meta Ads" },
    seo: { en: "SEO", nl: "SEO" },
  };
  const entry = labels[channel];
  return entry ? (nl ? entry.nl : entry.en) : channel;
}
