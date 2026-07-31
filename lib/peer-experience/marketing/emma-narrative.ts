import type { GeneratingActivity } from "@/lib/marketing-workspace/workflow-focus";
import type { MarketingContentDraft } from "@/lib/marketing-intelligence";
import { humanChannelLabel } from "./publish-preview-formatters";

export function greetingForHour(hour: number): string {
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export function statusLineForGenerating(
  activity: GeneratingActivity,
  activityLabel?: string | null
): string {
  switch (activity) {
    case "understanding":
      return "I'm understanding your business…";
    case "strategy":
      return "I'm building your strategy…";
    case "plan":
      return "I'm planning the campaign…";
    case "draft":
      return activityLabel
        ? `I'm writing ${activityLabel.toLowerCase()}…`
        : "I'm writing content…";
    case "publication":
      return activityLabel
        ? `I'm publishing ${activityLabel.toLowerCase()}…`
        : "I'm publishing now…";
  }
}

export function statusLineWhenMonitoring(): string {
  return "I'm monitoring performance…";
}

export function idleStatusLine(
  hasPendingReview: boolean,
  hasApproved: boolean
): string {
  if (hasPendingReview) return "I'm waiting for your approval.";
  if (hasApproved) return "I'm ready to publish when you give the word.";
  return "I'm here when you need me.";
}

/** Full employee workflow — maps to real generating state, never fake AI steps. */
export const EMPLOYEE_WORKFLOW_STAGES = [
  { id: "understanding", label: "Understanding business" },
  { id: "strategy", label: "Building strategy" },
  { id: "plan", label: "Planning campaign" },
  { id: "writing", label: "Writing content" },
  { id: "visuals", label: "Creating visuals" },
  { id: "scheduling", label: "Scheduling" },
  { id: "publishing", label: "Publishing" },
] as const;

/** Delegation tasks with visual deliverables — stage-based, no fake percentages. */
export const DELEGATION_WORKFLOW_STAGES = [
  { id: "understand-request", label: "Understanding your request" },
  { id: "campaign-angle", label: "Defining the campaign angle" },
  { id: "caption", label: "Writing the caption" },
  { id: "visual", label: "Generating the visual" },
  { id: "brand-review", label: "Reviewing brand consistency" },
  { id: "approval-prep", label: "Preparing for approval" },
  { id: "publishing", label: "Publishing" },
] as const;

const ACTIVITY_ACTIVE_INDEX: Record<GeneratingActivity, number> = {
  understanding: 0,
  strategy: 1,
  plan: 2,
  draft: 3,
  publication: 6,
};

export function pipelineStagesForGenerating(
  activity: GeneratingActivity
): { id: string; label: string; activeIndex: number } {
  const activeIndex = ACTIVITY_ACTIVE_INDEX[activity];
  return {
    id: activity,
    label: EMPLOYEE_WORKFLOW_STAGES[activeIndex]?.label ?? activity,
    activeIndex,
  };
}

export function accomplishmentToVoice(label: string, count: number): string {
  const normalized = label.toLowerCase();
  if (count === 1) {
    if (normalized.includes("newsletter")) return "Finished this week's newsletter";
    if (normalized.includes("linkedin")) return "Published a LinkedIn post";
    if (normalized.includes("meta")) return "Published a Meta ad";
    if (normalized.includes("campaign")) return "Approved yesterday's campaign";
    if (normalized.includes("scheduled")) return "Scheduled tomorrow's content";
    return `Completed ${normalized.replace(/s$/, "")}`;
  }
  if (normalized.includes("newsletter")) return `Finished ${count} newsletters`;
  if (normalized.includes("linkedin")) return `Published ${count} LinkedIn posts`;
  if (normalized.includes("meta")) return `Published ${count} Meta ads`;
  if (normalized.includes("campaign")) return `Completed ${count} campaigns`;
  return `Completed ${count} ${normalized}`;
}

export function buildRationaleLines(draft: MarketingContentDraft): string[] {
  const lines: string[] = [];

  if (draft.rationale?.why) {
    lines.push(draft.rationale.why);
  }

  if (draft.targetAudience) {
    lines.push(
      `I wrote this for ${draft.targetAudience} — they respond best to clear, direct messaging.`
    );
  }

  if (draft.callToAction) {
    lines.push(`I kept the call-to-action focused: "${draft.callToAction}".`);
  }

  if (draft.keywords.length > 0) {
    lines.push(
      `I prioritized ${draft.keywords.slice(0, 3).join(", ")} based on your strategy.`
    );
  }

  if (lines.length === 0) {
    lines.push(
      "I chose this direction because it aligns with what has performed well for your audience."
    );
  }

  return lines.slice(0, 4);
}

export function seoOpportunityToVoice(topic: string, intent: string): string {
  return `I found a keyword with opportunity around "${topic}".`;
}

export function seoOpportunityDetail(intent: string): string {
  return `Search intent: ${intent.toLowerCase()}. Worth a dedicated piece of content.`;
}

export function campaignIdeaToVoice(name: string): string {
  return `I think we should write about ${name}.`;
}

export function activityFeedToVoice(title: string): string {
  return title.endsWith(".") ? title : `${title}.`;
}

/**
 * Relative time in the customer's language.
 *
 * Optional locale with an English default, so the many existing callers are
 * unaffected while the Office can pass the customer's own. A timestamp reading
 * "Bijgewerkt 2 days ago" is the most visible kind of half-translation there
 * is, because it sits next to her voice.
 */
export function formatRelativeTime(iso: string, locale?: string | null): string {
  const nl = locale === "nl";
  try {
    const date = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours < 1) return nl ? "Zojuist" : "Just now";
    if (diffHours < 24) return nl ? `${diffHours} uur geleden` : `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return nl ? "Gisteren" : "Yesterday";
    if (diffDays < 7) return nl ? `${diffDays} dagen geleden` : `${diffDays} days ago`;
    return new Intl.DateTimeFormat(nl ? "nl-NL" : "en-GB", {
      day: "numeric",
      month: "short",
    }).format(date);
  } catch {
    return "";
  }
}
