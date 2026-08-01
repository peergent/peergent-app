import type { MarketingCampaignLocale } from "@/lib/i18n/marketing-campaign-copy";

export type ContentPreviewStat = { label: string; value: string };

const NL_STATS: Record<string, ContentPreviewStat[]> = {
  linkedin: [
    { label: "Impressies", value: "12.960" },
    { label: "Interactie", value: "1.284" },
    { label: "CTR", value: "3,2%" },
    { label: "Bereik", value: "9.840" },
  ],
  google_ads: [
    { label: "Impressies", value: "48.200" },
    { label: "Kliks", value: "1.978" },
    { label: "CTR", value: "4,1%" },
    { label: "CPA", value: "€94" },
  ],
  newsletter: [
    { label: "Open rate", value: "42%" },
    { label: "Doorkliks", value: "6,1%" },
    { label: "Leads", value: "18" },
    { label: "Omzet", value: "€8.400" },
  ],
  email: [
    { label: "Open rate", value: "42%" },
    { label: "Doorkliks", value: "6,1%" },
    { label: "Leads", value: "18" },
  ],
  instagram: [
    { label: "Bereik", value: "6.420" },
    { label: "Engagement", value: "842" },
    { label: "Volgers", value: "+214" },
  ],
  blog: [
    { label: "Bezoekers", value: "2.106" },
    { label: "Gem. tijd", value: "2:48" },
    { label: "Leads", value: "11" },
  ],
};

const EN_STATS: Record<string, ContentPreviewStat[]> = {
  linkedin: [
    { label: "Impressions", value: "12,960" },
    { label: "Engagement", value: "1,284" },
    { label: "CTR", value: "3.2%" },
    { label: "Reach", value: "9,840" },
  ],
  google_ads: [
    { label: "Impressions", value: "48,200" },
    { label: "Clicks", value: "1,978" },
    { label: "CTR", value: "4.1%" },
    { label: "CPA", value: "€94" },
  ],
  newsletter: [
    { label: "Open rate", value: "42%" },
    { label: "Clicks", value: "6.1%" },
    { label: "Leads", value: "18" },
    { label: "Revenue", value: "€8,400" },
  ],
  email: [
    { label: "Open rate", value: "42%" },
    { label: "Clicks", value: "6.1%" },
    { label: "Leads", value: "18" },
  ],
  instagram: [
    { label: "Reach", value: "6,420" },
    { label: "Engagement", value: "842" },
    { label: "Followers", value: "+214" },
  ],
  blog: [
    { label: "Visitors", value: "2,106" },
    { label: "Avg. time", value: "2:48" },
    { label: "Leads", value: "11" },
  ],
};

export function demoPreviewStatsForChannel(
  channelId: string | null | undefined,
  locale: MarketingCampaignLocale
): ContentPreviewStat[] {
  const key = (channelId ?? "linkedin").toLowerCase();
  const table = locale === "nl" ? NL_STATS : EN_STATS;
  return table[key] ?? table.linkedin ?? [];
}

export function firstPublishedDraftForProject(
  projectId: string,
  drafts: { id: string; status: string; channel?: string | null; contentType?: string | null }[],
  workUnits: { draftId?: string | null; projectId?: string | null }[]
): string | null {
  for (const draft of drafts) {
    if (draft.status !== "published") continue;
    const unit = workUnits.find((u) => u.draftId === draft.id);
    if (unit?.projectId === projectId) return draft.id;
  }
  return drafts.find((d) => d.status === "published")?.id ?? null;
}
