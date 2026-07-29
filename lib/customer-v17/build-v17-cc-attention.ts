import type { HomeNeedsYouItem } from "@/lib/home/types";
import type { MarketingCampaignLocale } from "@/lib/i18n/marketing-campaign-copy";
import {
  normalizeNeedsYouTitle,
  sanitizeV17CampaignDisplayName,
} from "./sanitize-v17-customer-text";
import type { HqServiceKey } from "@/lib/hq/hq-service-key";

export type V17CcAttentionCard = {
  id: string;
  title: string;
  contextLine: string;
  readinessLine: string;
  reviewHref: string;
  approveHref: string | null;
  serviceKey: HqServiceKey;
  peerId: string;
};

function attentionContextLine(
  item: HomeNeedsYouItem,
  locale: MarketingCampaignLocale
): string {
  const rawCampaign =
    sanitizeV17CampaignDisplayName(item.context?.trim() ?? "") ||
    sanitizeV17CampaignDisplayName(item.subtitle?.trim() ?? "") ||
    sanitizeV17CampaignDisplayName(item.title?.trim() ?? "");

  const campaign = rawCampaign || (locale === "nl" ? "Campagne" : "Campaign");

  const subtitle = item.subtitle?.trim() ?? "";
  const countMatch = subtitle.match(/(\d+)\s+(items?|onderdelen|deliverables?)/i);
  if (countMatch) {
    const n = countMatch[1];
    return locale === "nl"
      ? `${campaign} · ${n} onderdelen klaar`
      : `${campaign} · ${n} items ready`;
  }

  if (/ready for review|klaar voor beoordeling/i.test(subtitle)) {
    return locale === "nl"
      ? `${campaign} · klaar voor beoordeling`
      : `${campaign} · ready for review`;
  }

  if (subtitle && subtitle !== item.peerName && !subtitle.toLowerCase().includes(item.peerName.toLowerCase())) {
    const cleaned = sanitizeV17CampaignDisplayName(subtitle);
    if (cleaned) {
      return locale === "nl" ? `${campaign} · ${cleaned}` : `${campaign} · ${cleaned}`;
    }
  }

  return locale === "nl"
    ? `${campaign} · klaar voor beoordeling`
    : `${campaign} · ready for review`;
}

export function buildV17CommandCenterAttention(input: {
  items: HomeNeedsYouItem[];
  serviceKeyFor: (item: HomeNeedsYouItem) => HqServiceKey;
  locale: MarketingCampaignLocale;
  reviewCta: string;
  viewCta: string;
  approveCta: string;
}): { primary: V17CcAttentionCard | null; secondary: V17CcAttentionCard | null; total: number; viewAllHref: string } {
  const normalized = input.items.map((item) => {
    const title = normalizeNeedsYouTitle(item.subtitle || item.title, input.locale);
    const contextLine = attentionContextLine(item, input.locale);
    const readinessLine =
      input.locale === "nl" ? "klaar voor beoordeling" : "ready for review";
    return {
      id: item.id,
      title,
      contextLine,
      readinessLine,
      reviewHref: item.href,
      approveHref: null,
      serviceKey: input.serviceKeyFor(item),
      peerId: item.peerId,
    };
  });

  const primary = normalized[0] ?? null;
  let secondary: V17CcAttentionCard | null = null;
  if (normalized.length > 1) {
    const candidate = normalized[1]!;
    if (
      candidate.serviceKey !== primary?.serviceKey ||
      candidate.title !== primary?.title
    ) {
      secondary = candidate;
    }
  }

  return {
    primary,
    secondary,
    total: normalized.length,
    viewAllHref: "/inbox",
  };
}

export function v17AttentionCtas(card: V17CcAttentionCard, copy: {
  reviewCta: string;
  viewCta: string;
  approveCta: string;
}): { primary: { label: string; href: string }; secondary: { label: string; href: string } | null } {
  if (card.approveHref && card.approveHref !== card.reviewHref) {
    return {
      secondary: { label: copy.viewCta, href: card.reviewHref },
      primary: { label: copy.approveCta, href: card.approveHref },
    };
  }
  return {
    primary: { label: copy.reviewCta, href: card.reviewHref },
    secondary: null,
  };
}
