import { resolveMarketingWorkflowFocus } from "@/lib/marketing-workspace/workflow-focus";
import { greetingForHour } from "../emma-narrative";
import { humanChannelLabel } from "../publish-preview-formatters";
import type { MarketingMorningBriefViewModel } from "../domain/marketing-peer-types";
import type { MarketingPeerDomainInput } from "./marketing-peer-domain-input";
import { buildMarketingBrainInsights } from "./build-marketing-brain-insights";
import { buildUpcomingMarketingTasks } from "./build-marketing-upcoming-work";

function latestPublishedTitle(input: MarketingPeerDomainInput): string | null {
  const published = input.drafts
    .filter((d) => d.status === "published")
    .sort((a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime());
  const latest = published[0];
  if (!latest) return null;
  return `${humanChannelLabel(latest)} post “${latest.title}” was published.`;
}

export function buildMarketingMorningBrief(
  input: MarketingPeerDomainInput
): MarketingMorningBriefViewModel {
  const highlights: MarketingMorningBriefViewModel["highlights"] = [];
  const usedKeys = new Set<string>();

  const push = (kind: MarketingMorningBriefViewModel["highlights"][number]["kind"], text: string) => {
    const key = text.toLowerCase().slice(0, 40);
    if (usedKeys.has(key)) return;
    usedKeys.add(key);
    highlights.push({ id: `brief-${kind}-${highlights.length}`, text, kind });
  };

  const completed = latestPublishedTitle(input);
  if (completed) push("completed", completed);

  const focus = resolveMarketingWorkflowFocus({
    generating: input.generating,
    generatingActivity: input.generatingActivity,
    understanding: input.understanding,
    strategy: input.strategy,
    plan: input.plan,
    drafts: input.drafts,
    publicationPackages: input.publicationPackages,
  });

  if (input.generating && input.generatingActivity) {
    push("priority", `Emma is working on ${input.generatingActivity}.`);
  } else if (focus.kind === "draft_review") {
    push("priority", "Review is the top priority before anything publishes.");
  }

  const pending = input.drafts.filter((d) => d.status === "ready_for_review");
  if (pending.length === 1) {
    const draft = pending[0]!;
    push(
      "approval",
      `One ${humanChannelLabel(draft)} post is waiting for your approval.`
    );
  } else if (pending.length > 1) {
    push("approval", `${pending.length} items are waiting for your approval.`);
  }

  const brain = buildMarketingBrainInsights(input).find(
    (i) => i.category !== "optimization" || i.status !== "needs_approval"
  );
  if (brain && brain.observation) {
    push("insight", brain.observation.length > 120 ? `${brain.observation.slice(0, 117)}…` : brain.observation);
  }

  const upcoming = buildUpcomingMarketingTasks(input)[0]?.items[0];
  if (upcoming) {
    push(
      "upcoming",
      `Next up: ${upcoming.title} at ${upcoming.timeLabel} (${upcoming.originLabel}).`
    );
  }

  const pendingCount = pending.length;
  let intro = `Here's how your marketing is doing and what ${input.peerName} needs next.`;
  if (pendingCount > 0) {
    intro = `${input.peerName} needs your input on ${pendingCount} item${pendingCount === 1 ? "" : "s"} before publishing.`;
  } else if (input.generating) {
    intro = `${input.peerName} is actively working on ${input.generatingActivity ?? "your latest assignment"}.`;
  }

  return {
    greeting: greetingForHour(new Date().getHours()),
    userName: input.userName,
    intro,
    highlights: highlights.slice(0, 5),
  };
}
