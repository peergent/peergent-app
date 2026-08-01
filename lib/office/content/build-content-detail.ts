import type { MarketingPeerDomainInput } from "@/lib/peer-experience/marketing/view-models/marketing-peer-domain-input";
import type { MarketingContentDraft } from "@/lib/marketing-intelligence";
import { resolveProjectIdForDraft } from "../attribution";
import { officeHref } from "../links";

export type ContentDetailViewModel = {
  peerId: string;
  contentId: string;
  title: string;
  body: string;
  channelLabel: string;
  channelId: string;
  statusLabel: string;
  campaignTitle: string | null;
  campaignHref: string | null;
  publishedAtLabel: string | null;
  preview: string;
};

function channelLabel(channel: string, nl: boolean): string {
  const map: Record<string, { en: string; nl: string }> = {
    linkedin: { en: "LinkedIn", nl: "LinkedIn" },
    google_ads: { en: "Google Ads", nl: "Google Ads" },
    newsletter: { en: "Newsletter", nl: "Nieuwsbrief" },
    instagram: { en: "Instagram", nl: "Instagram" },
  };
  return map[channel]?.[nl ? "nl" : "en"] ?? channel;
}

function statusLabel(status: MarketingContentDraft["status"], nl: boolean): string {
  if (status === "published") return nl ? "Gepubliceerd" : "Published";
  if (status === "ready_for_review") return nl ? "Wacht op review" : "Awaiting review";
  if (status === "approved") return nl ? "Goedgekeurd" : "Approved";
  return status;
}

export function buildContentDetailViewModel(input: {
  peerId: string;
  contentId: string;
  domainInput: MarketingPeerDomainInput;
  locale?: string | null;
}): ContentDetailViewModel | null {
  const draft = input.domainInput.drafts.find((d) => d.id === input.contentId);
  if (!draft) return null;

  const nl = input.locale === "nl";
  const projectId = resolveProjectIdForDraft(draft, input.domainInput.workUnits);
  const project = projectId
    ? input.domainInput.projects.find((p) => p.id === projectId)
    : null;

  return {
    peerId: input.peerId,
    contentId: draft.id,
    title: draft.title,
    body: draft.body,
    channelLabel: channelLabel(draft.channel ?? "content", nl),
    channelId: draft.channel ?? "content",
    statusLabel: statusLabel(draft.status, nl),
    campaignTitle: project?.title ?? null,
    campaignHref: project
      ? `${officeHref(input.peerId, "work")}/campaigns/${project.id}`
      : null,
    publishedAtLabel: draft.generatedAt ?? null,
    preview: draft.body,
  };
}
