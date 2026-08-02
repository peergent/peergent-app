import type { MarketingPeerDomainInput } from "@/lib/peer-experience/marketing/view-models/marketing-peer-domain-input";
import type { MarketingContentDraft } from "@/lib/marketing-intelligence";
import type { DemoApprovalRecord } from "@/lib/office/demo/demo-campaign-store";
import { resolveProjectIdForDraft } from "../attribution";
import { officeHref } from "../links";
import { buildDeliverableReviewModel } from "../deliverable/build-deliverable-review";
import { formatOfficeDate } from "../campaign/campaign-optimization";

export type ContentLineageStep = {
  id: string;
  label: string;
  description: string;
  state: "done" | "active" | "upcoming";
};

export type ContentApprovalRecord = {
  action: string;
  by: string;
  at: string;
  atLabel?: string;
  notes?: string;
};

export type ContentPreviewFields = {
  emailFrom?: string;
  emailTo?: string;
  emailSubject?: string;
  emailPreheader?: string;
  emailCta?: string;
  linkedInPostCopy?: string;
  linkedInHashtags?: string;
  linkedInCta?: string;
  googleAdsCampaign?: string;
  googleAdsAdGroup?: string;
  googleAdsBudget?: string;
  googleAdsHeadlines?: string[];
  googleAdsDescriptions?: string[];
  googleAdsKeywords?: string;
  googleAdsTargeting?: string;
  googleAdsPreview?: string;
  landingHero?: string;
  landingSub?: string;
  landingSections?: string[];
  landingCta?: string;
  landingSeoTitle?: string;
  landingSeoDescription?: string;
};

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
  previewFields: ContentPreviewFields;
  objective: string | null;
  creationRationale: string | null;
  lineage: readonly ContentLineageStep[];
  approvalHistory: readonly ContentApprovalRecord[];
  analytics: readonly ContentAnalyticsMetric[];
  nextStepCta: { label: string; href: string } | null;
};

export type ContentAnalyticsMetric = {
  label: string;
  value: string;
};

function channelLabel(channel: string, nl: boolean): string {
  const map: Record<string, { en: string; nl: string }> = {
    linkedin: { en: "LinkedIn", nl: "LinkedIn" },
    google_ads: { en: "Google Ads", nl: "Google Ads" },
    newsletter: { en: "Newsletter", nl: "Nieuwsbrief" },
    email: { en: "Email", nl: "E-mail" },
    instagram: { en: "Instagram", nl: "Instagram" },
    blog: { en: "Blog", nl: "Blog" },
  };
  return map[channel]?.[nl ? "nl" : "en"] ?? channel;
}

function statusLabel(status: MarketingContentDraft["status"], nl: boolean): string {
  if (status === "published") return nl ? "Gepubliceerd" : "Published";
  if (status === "ready_for_review") return nl ? "Wacht op review" : "Awaiting review";
  if (status === "approved") return nl ? "Goedgekeurd" : "Approved";
  if (status === "ready_to_publish") return nl ? "Klaar om te publiceren" : "Ready to publish";
  if (status === "rejected") return nl ? "Afgewezen" : "Rejected";
  return status;
}

function demoAnalytics(
  draft: MarketingContentDraft,
  nl: boolean
): ContentAnalyticsMetric[] {
  if (draft.status !== "published") return [];

  const channel = draft.channel ?? "content";
  if (channel === "linkedin") {
    return nl
      ? [
          { label: "Impressies", value: "3.240" },
          { label: "Bereik", value: "2.180" },
          { label: "Engagement", value: "186" },
          { label: "CTR", value: "2,4%" },
          { label: "Kliks", value: "52" },
        ]
      : [
          { label: "Impressions", value: "3,240" },
          { label: "Reach", value: "2,180" },
          { label: "Engagement", value: "186" },
          { label: "CTR", value: "2.4%" },
          { label: "Clicks", value: "52" },
        ];
  }

  return nl
    ? [
        { label: "Impressies", value: "1.420" },
        { label: "Open rate", value: "38%" },
        { label: "Kliks", value: "94" },
        { label: "Conversies", value: "12" },
      ]
    : [
        { label: "Impressions", value: "1,420" },
        { label: "Open rate", value: "38%" },
        { label: "Clicks", value: "94" },
        { label: "Conversions", value: "12" },
      ];
}

export function buildContentDetailViewModel(input: {
  peerId: string;
  contentId: string;
  domainInput: MarketingPeerDomainInput;
  locale?: string | null;
  approvalHistory?: readonly DemoApprovalRecord[];
}): ContentDetailViewModel | null {
  const draft = input.domainInput.drafts.find((d) => d.id === input.contentId);
  if (!draft) return null;

  const nl = input.locale === "nl";
  const projectId = resolveProjectIdForDraft(draft, input.domainInput.workUnits);
  const project = projectId
    ? input.domainInput.projects.find((p) => p.id === projectId)
    : null;

  const campaignHref = project
    ? `${officeHref(input.peerId, "work")}/campaigns/${project.id}`
    : null;

  let nextStepCta: ContentDetailViewModel["nextStepCta"] = null;
  if (draft.status === "ready_for_review" && campaignHref) {
    nextStepCta = {
      label: nl ? "Keur goed in campagne →" : "Approve in campaign →",
      href: `${campaignHref}?review=${draft.id}`,
    };
  } else if (campaignHref) {
    nextStepCta = {
      label: nl ? "Terug naar campagne →" : "Back to campaign →",
      href: campaignHref,
    };
  }

  const reviewModel = buildDeliverableReviewModel({
    draftId: draft.id,
    domainInput: input.domainInput,
    locale: input.locale,
    approvalHistory: input.approvalHistory,
  });

  const previewFields: ContentPreviewFields = reviewModel
    ? {
        emailFrom: reviewModel.emailFrom,
        emailTo: reviewModel.emailTo,
        emailSubject: reviewModel.emailSubject,
        emailPreheader: reviewModel.emailPreheader,
        emailCta: reviewModel.emailCta,
        linkedInPostCopy: reviewModel.linkedInPostCopy,
        linkedInHashtags: reviewModel.linkedInHashtags,
        linkedInCta: reviewModel.linkedInCta,
        googleAdsCampaign: reviewModel.googleAdsCampaign,
        googleAdsAdGroup: reviewModel.googleAdsAdGroup,
        googleAdsBudget: reviewModel.googleAdsBudget,
        googleAdsHeadlines: reviewModel.googleAdsHeadlines,
        googleAdsDescriptions: reviewModel.googleAdsDescriptions,
        googleAdsKeywords: reviewModel.googleAdsKeywords,
        googleAdsTargeting: reviewModel.googleAdsTargeting,
        googleAdsPreview: reviewModel.googleAdsPreview,
        landingHero: reviewModel.landingHero,
        landingSub: reviewModel.landingSub,
        landingSections: reviewModel.landingSections,
        landingCta: reviewModel.landingCta,
        landingSeoTitle: reviewModel.landingSeoTitle,
        landingSeoDescription: reviewModel.landingSeoDescription,
      }
    : {};

  return {
    peerId: input.peerId,
    contentId: draft.id,
    title: draft.title,
    body: draft.body,
    channelLabel: channelLabel(draft.channel ?? "content", nl),
    channelId: draft.channel ?? "content",
    statusLabel: statusLabel(draft.status, nl),
    campaignTitle: project?.title ?? null,
    campaignHref,
    publishedAtLabel:
      draft.status === "published"
        ? formatOfficeDate(draft.generatedAt, input.locale)
        : null,
    previewFields,
    objective: draft.objective ?? null,
    creationRationale: draft.rationale?.why ?? null,
    lineage: [],
    approvalHistory: (input.approvalHistory ?? [])
      .filter((entry) => entry.draftId === draft.id)
      .map((entry) => ({
        action: entry.action,
        by: entry.by,
        at: entry.at,
        atLabel: formatOfficeDate(entry.at, input.locale) ?? entry.at,
        notes: entry.notes,
      })),
    analytics: demoAnalytics(draft, nl),
    nextStepCta,
  };
}
