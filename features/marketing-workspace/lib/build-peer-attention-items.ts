import type { MarketingCampaignLocale } from "@/lib/i18n/marketing-campaign-copy";
import { buildCampaignReviewViewModel } from "@/lib/peer-experience/marketing/campaign-review";
import { resolveCampaignProjectContext } from "@/lib/peer-experience/marketing/campaign-review/resolve-campaign-project-context";
import { isMarketingCampaignWorkspaceEnabled } from "@/lib/peer-experience/marketing/marketing-workspace-feature-flags";
import { buildAllMarketingApprovalQueue } from "@/lib/peer-experience/marketing/view-models/build-marketing-activity-mappers";
import type { MarketingPeerDomainInput } from "@/lib/peer-experience/marketing/view-models/marketing-peer-domain-input";
import { getCampaignReviewItemHref } from "@/lib/peer-experience/marketing/navigation/marketing-peer-links";
import { isCampaignWizardProject } from "@/lib/peer-experience/marketing/projects/campaign-project-detail-mode";
import type { PeerAttentionItemViewModel } from "@/lib/peer-experience/marketing/colleague/peer-presence-types";
import {
  classifyAttentionTitle,
  normalizeAttentionReason,
  normalizeAttentionTitle,
  type AttentionItemKind,
} from "@/lib/peer-experience/marketing/colleague/normalize-customer-workspace-content";
import { formatRelativeTime } from "@/lib/peer-experience/marketing/emma-narrative";
import { buildCampaignReviewBuildInput } from "./build-campaign-review-input";

function kindToIcon(kind: AttentionItemKind): PeerAttentionItemViewModel["icon"] {
  switch (kind) {
    case "campaign_strategy":
      return "strategy";
    case "campaign_creative":
      return "creative";
    case "campaign_plan":
      return "plan";
    case "connection":
      return "connection";
    case "content_approval":
    case "campaign_content":
      return "content";
    default:
      return "approval";
  }
}

type RawAttention = Omit<PeerAttentionItemViewModel, "kind" | "icon" | "itemCount"> & {
  projectId?: string;
  kind: AttentionItemKind;
};

export function buildMarketingPeerAttentionItems(input: {
  domainInput: MarketingPeerDomainInput;
  locale: MarketingCampaignLocale;
  primaryCtaLabel: string;
}): PeerAttentionItemViewModel[] {
  const { domainInput, locale, primaryCtaLabel } = input;
  const peerId = domainInput.peerId;
  const raw: RawAttention[] = [];
  const seen = new Set<string>();

  for (const queueItem of buildAllMarketingApprovalQueue(domainInput)) {
    if (seen.has(queueItem.id)) continue;
    seen.add(queueItem.id);
    const kind = classifyAttentionTitle(queueItem.title);
    raw.push({
      id: queueItem.id,
      title: normalizeAttentionTitle(queueItem.title, locale, kind),
      whyItMatters: normalizeAttentionReason(
        queueItem.attentionReason ?? "",
        locale
      ),
      primaryActionLabel: primaryCtaLabel,
      href: queueItem.reviewHref,
      projectTitle: queueItem.projectTitle,
      projectId: queueItem.projectId,
      ageLabel: queueItem.dueLabel,
      kind,
    });
  }

  if (isMarketingCampaignWorkspaceEnabled()) {
    for (const project of domainInput.projects) {
      if (!isCampaignWizardProject(project)) continue;
      const ctx = resolveCampaignProjectContext({
        domainInput,
        projectId: project.id,
        workspaceReady: true,
      });
      if (ctx.status !== "ready" || !ctx.campaignDetail) continue;

      const reviewInput = buildCampaignReviewBuildInput({
        peerId,
        projectId: project.id,
        domainInput,
        campaignDetail: ctx.campaignDetail,
        project: ctx.project,
        campaignsEnabled: true,
        continuationRunning: false,
        activeWorkUnitId: domainInput.activeWorkUnitId,
      });
      const vm = buildCampaignReviewViewModel(reviewInput);
      for (const reviewItem of vm.reviewQueue) {
        const key = `campaign:${project.id}:${reviewItem.id}`;
        if (seen.has(key)) continue;
        seen.add(key);
        const kind = classifyAttentionTitle(reviewItem.title);
        raw.push({
          id: key,
          title: normalizeAttentionTitle(reviewItem.title, locale, kind),
          whyItMatters: normalizeAttentionReason(
            reviewItem.shortSummary || reviewItem.statusLabel,
            locale
          ),
          primaryActionLabel: primaryCtaLabel,
          href: getCampaignReviewItemHref(peerId, project.id, reviewItem.id),
          projectTitle: project.title,
          projectId: project.id,
          ageLabel: reviewItem.updatedAt
            ? formatRelativeTime(reviewItem.updatedAt)
            : undefined,
          kind,
        });
      }
    }
  }

  return groupAttentionItems(raw, locale, primaryCtaLabel);
}

function groupAttentionItems(
  items: RawAttention[],
  locale: MarketingCampaignLocale,
  primaryCtaLabel: string
): PeerAttentionItemViewModel[] {
  const byProject = new Map<string, RawAttention[]>();
  const standalone: RawAttention[] = [];

  for (const item of items) {
    if (item.projectId && item.kind !== "content_approval") {
      const list = byProject.get(item.projectId) ?? [];
      list.push(item);
      byProject.set(item.projectId, list);
    } else {
      standalone.push(item);
    }
  }

  const grouped: PeerAttentionItemViewModel[] = [];

  for (const item of standalone) {
    grouped.push(toVm(item, "single"));
  }

  for (const [, list] of byProject) {
    if (list.length === 1) {
      grouped.push(toVm(list[0]!, "single"));
      continue;
    }
    const first = list[0]!;
    const count = list.length;
    const groupTitle =
      locale === "nl"
        ? `${count} onderdelen beoordelen`
        : `Review ${count} items`;
    grouped.push({
      id: `group:${first.projectId}`,
      title: groupTitle,
      whyItMatters:
        locale === "nl"
          ? `Voor ${first.projectTitle ?? "je campagne"} — ik kan verder na jouw beslissing.`
          : `For ${first.projectTitle ?? "your campaign"} — I can continue after your decision.`,
      primaryActionLabel: primaryCtaLabel,
      href: first.href,
      projectTitle: first.projectTitle,
      ageLabel: first.ageLabel,
      kind: "group",
      itemCount: count,
      icon: kindToIcon(first.kind),
    });
  }

  return grouped;
}

function toVm(item: RawAttention, kind: "single"): PeerAttentionItemViewModel {
  return {
    id: item.id,
    title: item.title,
    whyItMatters: item.whyItMatters,
    primaryActionLabel: item.primaryActionLabel,
    href: item.href,
    projectTitle: item.projectTitle,
    ageLabel: item.ageLabel,
    kind,
    icon: kindToIcon(item.kind),
  };
}

export function countMarketingPeerAttentionItems(
  domainInput: MarketingPeerDomainInput,
  locale: MarketingCampaignLocale
): number {
  return buildMarketingPeerAttentionItems({
    domainInput,
    locale,
    primaryCtaLabel: locale === "nl" ? "Beoordelen" : "Review",
  }).reduce((sum, item) => sum + (item.itemCount ?? 1), 0);
}

export function firstMarketingPeerAttentionHref(
  domainInput: MarketingPeerDomainInput,
  locale: MarketingCampaignLocale
): string | null {
  const items = buildMarketingPeerAttentionItems({
    domainInput,
    locale,
    primaryCtaLabel: "Review",
  });
  return items[0]?.href ?? null;
}
