import type { MarketingPeerDomainInput } from "@/lib/peer-experience/marketing/view-models/marketing-peer-domain-input";
import { getKnowledgeHref } from "@/lib/peer-experience/marketing/navigation/marketing-peer-links";
import { buildMarketingKnowledgeViewModel } from "@/lib/peer-experience/marketing/view-models/build-marketing-knowledge-view-model";

export type MarketingKnowledgeListItem = {
  id: string;
  title: string;
  source: string;
  updatedLabel: string;
  state: "ready" | "partial" | "needs_setup";
  summary?: string;
  href: string;
  editable: boolean;
};

const STATE_LABEL: Record<MarketingKnowledgeListItem["state"], string> = {
  ready: "Ready",
  partial: "Partial",
  needs_setup: "Needs setup",
};

export function knowledgeStateLabel(state: MarketingKnowledgeListItem["state"]): string {
  return STATE_LABEL[state];
}

export function buildMarketingKnowledgeItems(
  input: MarketingPeerDomainInput
): MarketingKnowledgeListItem[] {
  const vm = buildMarketingKnowledgeViewModel(input);
  const updated = "—";

  return vm.sections.map((section) => ({
    id: section.id,
    title: section.title,
    source: section.id === "website" ? "Website scan" : "Company profile",
    updatedLabel: updated,
    state: section.status,
    summary: section.description,
    href: section.href,
    editable: section.status !== "needs_setup" || section.id === "company",
  }));
}

export function buildMarketingSkillsList(input: MarketingPeerDomainInput): Array<{
  id: string;
  label: string;
  enabled: boolean;
}> {
  return input.responsibilities
    .filter((r) => r.enabled)
    .map((r) => ({
      id: r.id,
      label: r.title,
      enabled: true,
    }));
}

export function websiteScanHref(peerId: string): string {
  return `/team/${encodeURIComponent(peerId)}/settings/website-intelligence`;
}

export function knowledgeSectionHref(peerId: string, section: string): string {
  return getKnowledgeHref(peerId, section);
}
