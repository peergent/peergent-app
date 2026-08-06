import type { ExecutiveCampaignBriefing } from "@/lib/brain/presentation/executive-briefing";
import type { MarketingCampaignLocale } from "@/lib/i18n/marketing-campaign-copy";
import { getV17CampaignCopy } from "@/lib/i18n/v17-campaign-copy";
import { resolveCustomerLocalePreference } from "@/lib/i18n/resolve-customer-locale-preference";
import type {
  CampaignReviewItem,
  CampaignReviewViewModel,
} from "@/lib/peer-experience/marketing/campaign-review/campaign-review-types";
import type { MarketingProjectDetailViewModel } from "@/lib/peer-experience/marketing/view-models/build-marketing-project-detail-view-model";
import type { MarketingCampaignDetailViewModel } from "@/lib/peer-experience/marketing/view-models/marketing-campaign-types";
import type { MarketingPeerDomainInput } from "@/lib/peer-experience/marketing/view-models/marketing-peer-domain-input";
import type { MarketingProject } from "@/lib/peer-experience/marketing/projects/types";
import {
  getCampaignReviewItemHref,
  getCampaignInspectorHref,
} from "@/lib/peer-experience/marketing/navigation/marketing-peer-links";
import { formatRelativeTime } from "@/lib/peer-experience/marketing/emma-narrative";
import { sanitizeV17CampaignDisplayName, sanitizeV17CustomerLine } from "./sanitize-v17-customer-text";

export type V17CampaignReviewRow = {
  id: string;
  title: string;
  statusLabel: string;
  dateLabel: string;
  reviewHref: string;
};

export type V17CampaignDeliverableRow = {
  id: string;
  title: string;
  statusLabel: string;
  updatedLabel: string;
  href: string;
  actionLabel: string;
};

export type V17CampaignDetailRow = {
  label: string;
  value: string;
};

export type V17CampaignDetailViewModel = {
  peerId: string;
  projectId: string;
  backHref: string;
  backLabel: string;
  title: string;
  statusTag: string;
  dateRangeLine: string | null;
  goalLine: string | null;
  ownerLine: string | null;
  summaryLine: string | null;
  reviewHeading: string | null;
  reviewSubline: string | null;
  reviewRows: V17CampaignReviewRow[];
  progressTitle: string;
  progressLine: string | null;
  currentPhaseLabel: string | null;
  nextStepLine: string | null;
  deliverablesTitle: string;
  deliverables: V17CampaignDeliverableRow[];
  completedTitle: string;
  completedItems: Array<{ id: string; label: string }>;
  historyHref: string | null;
  detailsTitle: string;
  detailRows: V17CampaignDetailRow[];
  inspectorHref: string | null;
  inspectorLabel: string | null;
  primaryCta: { label: string; href: string } | null;
  executiveBriefing: ExecutiveCampaignBriefing | null;
  executiveBriefingPendingApproval: boolean;
  campaignPublicationUnlocked: boolean;
  allReviewItems: readonly import("@/lib/peer-experience/marketing/campaign-review").CampaignReviewItem[];
  locale: MarketingCampaignLocale;
  copy: ReturnType<typeof getV17CampaignCopy>;
};

function localizedCustomerStatus(
  raw: string,
  locale: MarketingCampaignLocale,
  copy: ReturnType<typeof getV17CampaignCopy>
): string {
  const lower = raw.toLowerCase();
  if (locale !== "nl") return raw;
  if (lower.includes("review") || lower.includes("waiting")) return "Wacht op beoordeling";
  if (lower.includes("active") || lower.includes("progress") || lower.includes("working")) return "Bezig";
  if (lower.includes("complete")) return "Afgerond";
  if (lower.includes("plan")) return "Gepland";
  if (lower.includes("ready")) return copy.stateReadyForReview;
  return raw;
}

function deliverableState(
  item: CampaignReviewItem,
  locale: MarketingCampaignLocale,
  copy: ReturnType<typeof getV17CampaignCopy>
): string {
  if (item.inReviewQueue || item.status === "awaiting_review") return copy.stateReadyForReview;
  if (item.decisionStatus === "approved") return copy.stateApproved;
  if (item.status === "in_progress") return copy.stateInProgress;
  if (item.status === "blocked") return copy.stateBlocked;
  if (item.status === "prepared") return copy.statePreparing;
  return locale === "nl" ? "In voorbereiding" : "In progress";
}

function relativeDate(iso: string | null | undefined, locale: MarketingCampaignLocale): string {
  if (!iso) return "";
  const label = formatRelativeTime(iso);
  if (locale === "nl") {
    if (/yesterday/i.test(label)) return "gisteren";
    if (/just now/i.test(label)) return "zojuist";
  }
  return label;
}

function customerSummary(input: {
  reviewVm: CampaignReviewViewModel | null;
  campaignDetail: MarketingCampaignDetailViewModel | null;
  vm: MarketingProjectDetailViewModel | null;
  locale: MarketingCampaignLocale;
}): string | null {
  const fromReview = input.reviewVm?.customerSummary?.trim();
  if (fromReview) {
    const cleaned = sanitizeV17CustomerLine(fromReview, input.locale);
    if (cleaned && cleaned.length <= 280) return cleaned;
    if (cleaned) return `${cleaned.slice(0, 277).trim()}…`;
  }
  const desc = input.campaignDetail?.description?.trim();
  if (desc) {
    const cleaned = sanitizeV17CustomerLine(desc, input.locale);
    if (cleaned) return cleaned.length <= 280 ? cleaned : `${cleaned.slice(0, 277).trim()}…`;
  }
  const hero = input.vm?.experience.hero.heroMessage;
  if (hero) {
    const cleaned = sanitizeV17CustomerLine(hero, input.locale);
    if (cleaned) return cleaned.length <= 280 ? cleaned : `${cleaned.slice(0, 277).trim()}…`;
  }
  return null;
}

export function buildV17CampaignDetailViewModel(input: {
  peerId: string;
  projectId: string;
  domainInput: MarketingPeerDomainInput;
  project: MarketingProject;
  vm?: MarketingProjectDetailViewModel | null;
  campaignDetail?: MarketingCampaignDetailViewModel | null;
  reviewVm?: CampaignReviewViewModel | null;
  localePreference?: string | null;
  showInspectorLink?: boolean;
}): V17CampaignDetailViewModel {
  const locale = resolveCustomerLocalePreference(input.localePreference) as MarketingCampaignLocale;
  const copy = getV17CampaignCopy(input.localePreference);
  const reviewVm = input.reviewVm ?? null;
  const vm = input.vm ?? null;
  const campaignDetail = input.campaignDetail ?? null;

  const title =
    sanitizeV17CampaignDisplayName(campaignDetail?.title ?? vm?.title ?? input.project.title) ||
    input.project.title;

  const statusRaw =
    reviewVm?.campaignStatusLabel ?? vm?.statusLabel ?? "active";
  const statusTag = localizedCustomerStatus(statusRaw, locale, copy);

  const queue = reviewVm?.reviewQueue.filter((i) => i.inReviewQueue && i.preview) ?? [];
  const executiveBriefingPending = reviewVm?.executiveBriefingPendingApproval ?? false;
  const reviewRows: V17CampaignReviewRow[] = executiveBriefingPending
    ? []
    : queue.slice(0, 6).map((item) => ({
    id: item.id,
    title: item.title,
    statusLabel: copy.stateReadyForReview,
    dateLabel: relativeDate(item.updatedAt ?? item.createdAt, locale),
    reviewHref: getCampaignReviewItemHref(input.peerId, input.projectId, item.id),
  }));

  const briefingHeading =
    executiveBriefingPending && reviewVm?.executiveBriefing
      ? locale === "nl"
        ? "Management briefing"
        : "Management briefing"
      : null;
  const briefingSubline = executiveBriefingPending
    ? locale === "nl"
      ? "Emma heeft al het interne werk afgerond. Eén review, dan gaat ze verder."
      : "Emma completed all internal work. One review, then she continues."
    : null;

  const allItems = reviewVm?.allReviewItems ?? [];
  const deliverables: V17CampaignDeliverableRow[] = allItems.slice(0, 8).map((item) => {
    const canReview = item.inReviewQueue && item.preview;
    return {
      id: item.id,
      title: item.title,
      statusLabel: deliverableState(item, locale, copy),
      updatedLabel: relativeDate(item.updatedAt, locale),
      href: canReview
        ? getCampaignReviewItemHref(input.peerId, input.projectId, item.id)
        : getCampaignReviewItemHref(input.peerId, input.projectId, item.id),
      actionLabel: canReview ? copy.reviewCta : copy.viewCta,
    };
  });

  const completedItems =
    reviewVm?.completedItems.slice(0, 5).map((item) => ({
      id: item.id,
      label: item.title,
    })) ??
    vm?.experience.timeline
      .filter((t) => t.kind === "milestone" || t.kind === "publish")
      .slice(0, 5)
      .map((t) => ({ id: t.id, label: sanitizeV17CustomerLine(t.message, locale) || t.message })) ??
    [];

  const prepared = reviewVm?.progress.preparedCount ?? 0;
  const total = reviewVm?.progress.totalCount ?? 0;
  const progressLine =
    total > 0 ? copy.progressParts(prepared, total) : vm?.experience.hero.progress
      ? `${vm.experience.hero.progress}%`
      : null;

  const detailRows: V17CampaignDetailRow[] = [];
  const goal = campaignDetail?.goal?.marketingObjective ?? vm?.goal;
  if (goal) detailRows.push({ label: locale === "nl" ? "Doel" : "Goal", value: goal });
  if (input.project.campaignSetup?.confirmedAudience || input.project.campaignSetup?.targetAudience) {
    detailRows.push({
      label: locale === "nl" ? "Doelgroep" : "Audience",
      value:
        input.project.campaignSetup.confirmedAudience ??
        input.project.campaignSetup.targetAudience ??
        "",
    });
  }
  if (campaignDetail?.timeline?.summary) {
    detailRows.push({
      label: locale === "nl" ? "Periode" : "Timeline",
      value: campaignDetail.timeline.summary,
    });
  }

  const start = input.project.campaignSetup?.startDate;
  const end = input.project.campaignSetup?.endDate;
  let dateRangeLine: string | null = null;
  if (start || end) {
    const fmt = (d: string) =>
      new Date(d).toLocaleDateString(locale === "nl" ? "nl-NL" : "en-US", {
        day: "numeric",
        month: "short",
      });
    if (start && end) dateRangeLine = `${fmt(start)} – ${fmt(end)}`;
    else if (start) dateRangeLine = fmt(start);
  }

  return {
    peerId: input.peerId,
    projectId: input.projectId,
    backHref: `/team/${input.peerId}/work`,
    backLabel: copy.backToCampaigns,
    title,
    statusTag,
    dateRangeLine,
    goalLine: goal ? sanitizeV17CustomerLine(goal, locale) : null,
    ownerLine: input.domainInput.peerName,
    summaryLine: customerSummary({ reviewVm, campaignDetail, vm, locale }),
    reviewHeading:
      briefingHeading ?? (reviewRows.length > 0 ? copy.waitingForYou(reviewRows.length) : null),
    reviewSubline:
      briefingSubline ?? (reviewRows.length > 0 ? copy.waitingSummary(reviewRows.length) : null),
    reviewRows,
    progressTitle: copy.progressTitle,
    progressLine,
    currentPhaseLabel:
      reviewVm?.progress.phases.find((p) => p.current)?.label ??
      vm?.experience.hero.phaseLabel ??
      null,
    nextStepLine:
      sanitizeV17CustomerLine(reviewVm?.activitySummary.upNext ?? vm?.experience.nextStep.label ?? "", locale) ||
      null,
    deliverablesTitle: copy.deliverablesTitle,
    deliverables,
    completedTitle: copy.completedTitle,
    completedItems,
    historyHref: `/team/${input.peerId}/done`,
    detailsTitle: copy.detailsTitle,
    detailRows,
    inspectorHref: input.showInspectorLink
      ? getCampaignInspectorHref(input.peerId, input.projectId)
      : null,
    inspectorLabel: input.showInspectorLink ? copy.openInspector : null,
    primaryCta: executiveBriefingPending
      ? {
          label: reviewVm?.primaryActionLabel ?? copy.reviewCta,
          href: `#executive-briefing`,
        }
      : reviewVm?.primaryActionHref && reviewVm.primaryActionLabel
        ? { label: reviewVm.primaryActionLabel, href: reviewVm.primaryActionHref }
        : vm?.experience.hero.primaryCta ?? null,
    executiveBriefing: reviewVm?.executiveBriefing ?? null,
    executiveBriefingPendingApproval: executiveBriefingPending,
    campaignPublicationUnlocked: reviewVm?.campaignPublicationUnlocked ?? false,
    allReviewItems: reviewVm?.allReviewItems ?? [],
    locale,
    copy,
  };
}
