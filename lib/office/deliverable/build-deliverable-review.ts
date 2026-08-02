import type { MarketingPeerDomainInput } from "@/lib/peer-experience/marketing/view-models/marketing-peer-domain-input";
import type { DemoApprovalRecord } from "@/lib/office/demo/demo-campaign-store";
import { resolveProjectIdForDraft } from "../attribution";
import type { DeliverableReviewModel } from "@/features/office/deliverable/OfficeDeliverableReviewModal";

function channelLabel(channel: string, nl: boolean): string {
  const map: Record<string, { en: string; nl: string }> = {
    linkedin: { en: "LinkedIn", nl: "LinkedIn" },
    email: { en: "Acquisition email", nl: "Acquisition e-mail" },
    newsletter: { en: "Newsletter", nl: "Nieuwsbrief" },
    google_ads: { en: "Google Ads", nl: "Google Ads" },
    instagram: { en: "Instagram", nl: "Instagram" },
    website_landing: { en: "Landing page", nl: "Landingspagina" },
  };
  return map[channel]?.[nl ? "nl" : "en"] ?? channel;
}

function parseEmailMeta(body: string): {
  from?: string;
  to?: string;
  subject?: string;
  preheader?: string;
  cta?: string;
  content: string;
} {
  const lines = body.split("\n");
  let from: string | undefined;
  let to: string | undefined;
  let subject: string | undefined;
  let preheader: string | undefined;
  let cta: string | undefined;
  const contentLines: string[] = [];
  let inBody = false;

  for (const line of lines) {
    if (line.startsWith("From:")) from = line.replace("From:", "").trim();
    else if (line.startsWith("To:")) to = line.replace("To:", "").trim();
    else if (line.startsWith("Subject:")) subject = line.replace("Subject:", "").trim();
    else if (line.startsWith("Preheader:")) preheader = line.replace("Preheader:", "").trim();
    else if (line.startsWith("CTA:")) cta = line.replace("CTA:", "").trim();
    else if (line === "---") inBody = true;
    else if (inBody) contentLines.push(line);
  }

  return {
    from,
    to,
    subject,
    preheader,
    cta,
    content: contentLines.join("\n").trim() || body,
  };
}

function parseLinkedInMeta(body: string): {
  postCopy: string;
  hashtags?: string;
  cta?: string;
} {
  const hashtagMatch = body.match(/(?:^|\n)Hashtags:\s*([^\n]+)/);
  const ctaMatch = body.match(/(?:^|\n)CTA:\s*(.+)$/);
  const postCopy = body.split(/\nHashtags:/)[0]?.split(/\nCTA:/)[0]?.trim() ?? body.trim();
  return {
    postCopy,
    hashtags: hashtagMatch?.[1]?.trim(),
    cta: ctaMatch?.[1]?.trim(),
  };
}

function parseGoogleAdsMeta(body: string): {
  campaign?: string;
  adGroup?: string;
  budget?: string;
  headlines: string[];
  descriptions: string[];
  keywords?: string;
  targeting?: string;
  preview?: string;
} {
  const previewSplit = body.split("\n---\n");
  const main = previewSplit[0] ?? body;
  const preview = previewSplit[1]?.replace(/^Preview:\s*/i, "").trim();

  const headlines: string[] = [];
  const descriptions: string[] = [];
  let campaign: string | undefined;
  let adGroup: string | undefined;
  let budget: string | undefined;
  let keywords: string | undefined;
  let targeting: string | undefined;

  for (const line of main.split("\n")) {
    if (line.startsWith("Campaign:")) campaign = line.replace("Campaign:", "").trim();
    else if (line.startsWith("Ad group:")) adGroup = line.replace("Ad group:", "").trim();
    else if (line.startsWith("Budget:")) budget = line.replace("Budget:", "").trim();
    else if (/^Headline \d+:/.test(line)) headlines.push(line.replace(/^Headline \d+:\s*/, ""));
    else if (/^Description \d+:/.test(line)) descriptions.push(line.replace(/^Description \d+:\s*/, ""));
    else if (line.startsWith("Keywords:")) keywords = line.replace("Keywords:", "").trim();
    else if (line.startsWith("Targeting:")) targeting = line.replace("Targeting:", "").trim();
  }

  return { campaign, adGroup, budget, headlines, descriptions, keywords, targeting, preview };
}

function parseLandingPageMeta(body: string): {
  hero?: string;
  sub?: string;
  sections: string[];
  cta?: string;
  seoTitle?: string;
  seoDescription?: string;
} {
  const sections: string[] = [];
  let hero: string | undefined;
  let sub: string | undefined;
  let cta: string | undefined;
  let seoTitle: string | undefined;
  let seoDescription: string | undefined;

  for (const line of body.split("\n")) {
    if (line.startsWith("Hero:")) hero = line.replace("Hero:", "").trim();
    else if (line.startsWith("Sub:")) sub = line.replace("Sub:", "").trim();
    else if (/^Section \d+:/.test(line)) sections.push(line.replace(/^Section \d+:\s*/, ""));
    else if (line.startsWith("CTA:")) cta = line.replace("CTA:", "").trim();
    else if (line.startsWith("SEO title:")) seoTitle = line.replace("SEO title:", "").trim();
    else if (line.startsWith("SEO description:"))
      seoDescription = line.replace("SEO description:", "").trim();
  }

  return { hero, sub, sections, cta, seoTitle, seoDescription };
}

export function buildDeliverableReviewModel(input: {
  draftId: string;
  domainInput: MarketingPeerDomainInput;
  locale?: string | null;
  approvalHistory?: readonly DemoApprovalRecord[];
}): DeliverableReviewModel | null {
  const draft = input.domainInput.drafts.find((d) => d.id === input.draftId);
  if (!draft) return null;

  const nl = input.locale === "nl";
  const projectId = resolveProjectIdForDraft(draft, input.domainInput.workUnits);
  const project = projectId
    ? input.domainInput.projects.find((p) => p.id === projectId)
    : null;

  const channel = draft.channel ?? "content";
  const isEmail = channel === "email";
  const isNewsletterOnly = channel === "newsletter";
  const isLinkedIn = channel === "linkedin";
  const isGoogleAds = channel === "google_ads";
  const isLanding = channel === "website_landing";

  const emailMeta = isEmail ? parseEmailMeta(draft.body) : null;
  const linkedInMeta = isLinkedIn ? parseLinkedInMeta(draft.body) : null;
  const googleAdsMeta = isGoogleAds ? parseGoogleAdsMeta(draft.body) : null;
  const landingMeta = isLanding ? parseLandingPageMeta(draft.body) : null;

  const displayBody =
    emailMeta?.content ??
    linkedInMeta?.postCopy ??
    (isNewsletterOnly ? draft.body : null) ??
    draft.body;

  return {
    draftId: draft.id,
    title: draft.title,
    channelLabel: channelLabel(channel, nl),
    channelId: channel,
    body: displayBody,
    objective: draft.objective,
    rationale: draft.rationale?.why,
    status: draft.status,
    emailFrom: emailMeta?.from,
    emailTo: emailMeta?.to,
    emailSubject: emailMeta?.subject ?? (isEmail ? draft.title : undefined),
    emailPreheader: emailMeta?.preheader,
    emailCta: emailMeta?.cta ?? draft.callToAction ?? undefined,
    linkedInPostCopy: linkedInMeta?.postCopy,
    linkedInHashtags: linkedInMeta?.hashtags,
    linkedInCta: linkedInMeta?.cta ?? draft.callToAction ?? undefined,
    googleAdsCampaign: googleAdsMeta?.campaign,
    googleAdsAdGroup: googleAdsMeta?.adGroup,
    googleAdsBudget: googleAdsMeta?.budget,
    googleAdsHeadlines: googleAdsMeta?.headlines,
    googleAdsDescriptions: googleAdsMeta?.descriptions,
    googleAdsKeywords: googleAdsMeta?.keywords,
    googleAdsTargeting: googleAdsMeta?.targeting,
    googleAdsPreview: googleAdsMeta?.preview,
    landingHero: landingMeta?.hero,
    landingSub: landingMeta?.sub,
    landingSections: landingMeta?.sections,
    landingCta: landingMeta?.cta ?? draft.callToAction ?? undefined,
    landingSeoTitle: landingMeta?.seoTitle,
    landingSeoDescription: landingMeta?.seoDescription,
    campaignTitle: project?.title,
    approvalHistory: input.approvalHistory ? [...input.approvalHistory] : undefined,
  };
}

export function draftIdsPendingApproval(
  domainInput: MarketingPeerDomainInput,
  projectId?: string
): string[] {
  return domainInput.drafts
    .filter((draft) => {
      if (draft.status !== "ready_for_review") return false;
      if (!projectId) return true;
      return resolveProjectIdForDraft(draft, domainInput.workUnits) === projectId;
    })
    .map((draft) => draft.id);
}
