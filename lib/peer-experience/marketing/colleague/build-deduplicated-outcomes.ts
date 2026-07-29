import type { OutcomeCategory } from "./normalize-customer-workspace-content";
import type { MarketingCampaignLocale } from "@/lib/i18n/marketing-campaign-copy";
import { buildMarketingActivities } from "../view-models/build-marketing-activity-mappers";
import type { MarketingPeerDomainInput } from "../view-models/marketing-peer-domain-input";
import {
  localizeOutcomePresentation,
  outcomeCategoryForActivity,
} from "./normalize-customer-workspace-content";
import type { PeerCompletedOutcomeViewModel } from "./peer-presence-types";

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function outcomeGroup(iso: string, now: Date): PeerCompletedOutcomeViewModel["group"] {
  const t = new Date(iso);
  if (Number.isNaN(t.getTime())) return "older";
  const today = startOfDay(now).getTime();
  const ts = startOfDay(t).getTime();
  const dayMs = 86400000;
  if (ts === today) return "today";
  if (ts === today - dayMs) return "yesterday";
  if (ts >= today - dayMs * 7) return "this_week";
  return "older";
}

const OUTCOME_TYPES = new Set([
  "published",
  "scheduled",
  "completed",
  "approved",
  "sent",
  "measured",
  "optimized",
  "generated",
]);

function mergeOutcomeCategory(a: OutcomeCategory, b: OutcomeCategory): OutcomeCategory {
  if (a === b) return a;
  if (
    (a === "strategy" && b === "approval") ||
    (a === "approval" && b === "strategy")
  ) {
    return "strategy";
  }
  if (
    (a === "content" && b === "approval") ||
    (a === "approval" && b === "content")
  ) {
    return "content";
  }
  return a;
}

function resolveProjectTitle(
  input: MarketingPeerDomainInput,
  activity: ReturnType<typeof buildMarketingActivities>[number]
): string | undefined {
  const targetId = activity.target.id;
  if (activity.target.kind === "project" && targetId) {
    return input.projects.find((p) => p.id === targetId)?.title;
  }
  return input.projects.find((p) => p.title === activity.title)?.title;
}

export function buildDeduplicatedCompletedOutcomes(input: {
  domainInput: MarketingPeerDomainInput;
  locale: MarketingCampaignLocale;
  now?: Date;
}): PeerCompletedOutcomeViewModel[] {
  const now = input.now ?? new Date();
  const activities = buildMarketingActivities(input.domainInput).filter((a) =>
    OUTCOME_TYPES.has(a.type)
  );

  const bucket = new Map<
    string,
    PeerCompletedOutcomeViewModel & { category: OutcomeCategory }
  >();

  for (const activity of activities) {
    const projectTitle = resolveProjectTitle(input.domainInput, activity);
    const { title, valueStatement, dedupeKey } = localizeOutcomePresentation({
      activity,
      locale: input.locale,
      projectTitle,
    });
    const category = outcomeCategoryForActivity(activity);
    const existing = bucket.get(dedupeKey);
    const occurred = activity.occurredAt;

    if (!existing) {
      bucket.set(dedupeKey, {
        id: dedupeKey,
        title,
        summary: valueStatement,
        projectTitle,
        completedAt: occurred,
        href: activity.target.href,
        group: outcomeGroup(occurred, now),
        category,
      });
      continue;
    }

    const mergedCategory = mergeOutcomeCategory(existing.category, category);
    const latest =
      new Date(occurred).getTime() > new Date(existing.completedAt).getTime()
        ? occurred
        : existing.completedAt;

    const mergedTitle =
      mergedCategory === "strategy"
        ? input.locale === "nl"
          ? "Campagnestrategie afgerond"
          : "Campaign strategy completed"
        : existing.title;

    const mergedSummary =
      mergedCategory === "strategy"
        ? input.locale === "nl"
          ? "Opgesteld en goedgekeurd"
          : "Prepared and approved"
        : existing.summary;

    bucket.set(dedupeKey, {
      ...existing,
      title: mergedTitle,
      summary: mergedSummary,
      completedAt: latest,
      group: outcomeGroup(latest, now),
      category: mergedCategory,
      href: existing.href ?? activity.target.href,
    });
  }

  return [...bucket.values()]
    .sort(
      (a, b) =>
        new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
    )
    .slice(0, 24)
    .map(({ category: _c, ...rest }) => rest);
}
