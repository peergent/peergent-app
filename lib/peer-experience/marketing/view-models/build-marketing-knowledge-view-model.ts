import type { MarketingPeerDomainInput } from "./marketing-peer-domain-input";
import { getKnowledgeHref, getSettingsHref } from "../navigation/marketing-peer-links";

export type MarketingKnowledgeSection = {
  id: string;
  title: string;
  description: string;
  status: "ready" | "partial" | "needs_setup";
  href: string;
};

export type MarketingKnowledgeViewModel = {
  sections: MarketingKnowledgeSection[];
  completeness: number;
  emptyMessage: string;
};

export function buildMarketingKnowledgeViewModel(
  input: MarketingPeerDomainInput
): MarketingKnowledgeViewModel {
  const understanding = input.understanding;
  const completeness = understanding?.completeness ?? 0;
  const hasStrategy = Boolean(input.strategy);
  const gaps = understanding?.gaps?.length ?? 0;

  const sections: MarketingKnowledgeSection[] = [
    {
      id: "company",
      title: "Company profile",
      description: "Business context Emma uses for every decision.",
      status: completeness >= 60 ? "ready" : completeness > 0 ? "partial" : "needs_setup",
      href: getKnowledgeHref(input.peerId, "company"),
    },
    {
      id: "website",
      title: "Website knowledge",
      description: "Pages, products and messaging from your site.",
      status: completeness >= 40 ? "partial" : "needs_setup",
      href: getKnowledgeHref(input.peerId, "website"),
    },
    {
      id: "audiences",
      title: "Target audiences",
      description: "Who Emma creates for and why.",
      status: hasStrategy ? "partial" : "needs_setup",
      href: getKnowledgeHref(input.peerId, "audiences"),
    },
    {
      id: "brand",
      title: "Brand voice & rules",
      description: "Tone, constraints and marketing rules.",
      status: hasStrategy ? "partial" : "needs_setup",
      href: getKnowledgeHref(input.peerId, "brand"),
    },
    {
      id: "documents",
      title: "Documents",
      description: "Uploads and reference files — coming in a later sprint.",
      status: "needs_setup",
      href: getKnowledgeHref(input.peerId, "documents"),
    },
    {
      id: "assets",
      title: "Brand assets & media",
      description: "Logos, colours and reusable media — library connects later.",
      status: "needs_setup",
      href: getKnowledgeHref(input.peerId, "assets"),
    },
    {
      id: "competitors",
      title: "Competitors",
      description: "Competitive context for monitoring and insights.",
      status: "needs_setup",
      href: getKnowledgeHref(input.peerId, "competitors"),
    },
    {
      id: "integrations",
      title: "Connected systems",
      description: "Channels and business systems Emma can access.",
      status: input.connections.some((c) => c.status === "connected") ? "partial" : "needs_setup",
      href: getSettingsHref(input.peerId),
    },
  ];

  return {
    sections,
    completeness,
    emptyMessage:
      gaps > 0
        ? `${gaps} knowledge gap${gaps === 1 ? "" : "s"} remain. Complete setup so Emma can work with full context.`
        : "Knowledge powers every piece of work Emma creates.",
  };
}
