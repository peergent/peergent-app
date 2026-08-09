import type { BrainStructuredOutput } from "@/lib/brain/evidence/structured-output";
import type { Decision } from "@/lib/brain/decision/decision-types";
import { capabilityToBrainSource } from "../capability-source";
import { sanitizeCustomerText } from "../sanitize";
import type {
  LiveActivityEvent,
  RecentDecision,
  RecentDiscovery,
  RecentLearning,
} from "../types";

function relativeTimeLabel(iso: string, nl: boolean, now: Date): string {
  const then = new Date(iso).getTime();
  const diffMs = now.getTime() - then;
  const minutes = Math.round(diffMs / 60_000);
  if (minutes < 60) {
    return nl ? `${Math.max(1, minutes)} minuten geleden` : `${Math.max(1, minutes)} minutes ago`;
  }
  const hours = Math.round(minutes / 60);
  return nl ? `${hours} uur geleden` : `${hours} hours ago`;
}

const CAPABILITY_ACTIVITY: Record<
  string,
  { en: { title: string; subtitle: string; tone: LiveActivityEvent["tone"] }; nl: { title: string; subtitle: string; tone: LiveActivityEvent["tone"] } }
> = {
  strategy: {
    en: { title: "Strategy decided", subtitle: "Campaign direction locked based on research.", tone: "insight" },
    nl: { title: "Strategie vastgesteld", subtitle: "Campagnerichting vastgelegd op basis van research.", tone: "insight" },
  },
  channel_planning: {
    en: { title: "Channels selected", subtitle: "Budget allocation aligned to expected ROI.", tone: "success" },
    nl: { title: "Kanalen geselecteerd", subtitle: "Budgetverdeling afgestemd op verwachte ROI.", tone: "success" },
  },
  campaign_planning: {
    en: { title: "Execution plan ready", subtitle: "Timeline and milestones defined.", tone: "success" },
    nl: { title: "Executieplan klaar", subtitle: "Tijdlijn en mijlpalen vastgelegd.", tone: "success" },
  },
  creative_generation: {
    en: { title: "Creative generated", subtitle: "Deliverables ready for your review.", tone: "success" },
    nl: { title: "Creative gegenereerd", subtitle: "Deliverables klaar voor je review.", tone: "success" },
  },
};

export function publishActivityEvents(input: {
  outputs: Partial<Record<string, BrainStructuredOutput>>;
  decisions: readonly Decision[];
  nl: boolean;
  now: Date;
}): readonly LiveActivityEvent[] {
  const nl = input.nl;
  const events: LiveActivityEvent[] = [];

  for (const [capabilityId, output] of Object.entries(input.outputs)) {
    if (!output) continue;
    const template = CAPABILITY_ACTIVITY[capabilityId];
    const source = capabilityToBrainSource(capabilityId);
    const generatedAt = output.generatedAt;

    if (template) {
      const copy = nl ? template.nl : template.en;
      events.push({
        id: `activity-${capabilityId}`,
        timestamp: generatedAt,
        timeLabel: relativeTimeLabel(generatedAt, nl, input.now),
        title: copy.title,
        subtitle: copy.subtitle,
        tone: copy.tone,
        sourceBrain: source,
        whyItMatters: nl
          ? "Dit brengt de campagne dichter bij publicatie."
          : "This moves the campaign closer to publication.",
        href: null,
      });
    }

    for (const result of output.executionResults.slice(0, 2)) {
      const summary = sanitizeCustomerText(result.summary);
      if (!summary) continue;
      events.push({
        id: `activity-exec-${result.id}`,
        timestamp: generatedAt,
        timeLabel: relativeTimeLabel(generatedAt, nl, input.now),
        title: summary,
        subtitle: nl ? "Uitgevoerd door Emma." : "Executed by Emma.",
        tone: "neutral",
        sourceBrain: source,
        whyItMatters: nl ? "Voortgang in de campagne-executie." : "Progress in campaign execution.",
        href: null,
      });
    }
  }

  return events.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
}

export function publishRecentDiscoveries(input: {
  strategy?: BrainStructuredOutput;
}): readonly RecentDiscovery[] {
  if (!input.strategy) return [];
  return input.strategy.findings.slice(0, 5).map((finding) => ({
    id: finding.id,
    title: finding.label,
    summary: finding.value,
    sourceBrain: capabilityToBrainSource(input.strategy!.capabilityId),
    at: input.strategy!.generatedAt,
  }));
}

export function publishRecentDecisions(input: {
  decisions: readonly Decision[];
}): readonly RecentDecision[] {
  return input.decisions.slice(0, 5).map((decision) => ({
    id: decision.id,
    title: decision.title,
    rationale: decision.recommendation,
    at: decision.createdAt,
    source: "strategy" as const,
  }));
}

export function publishRecentLearnings(input: {
  strategy?: BrainStructuredOutput;
}): readonly RecentLearning[] {
  const warnings = input.strategy?.warnings ?? [];
  return warnings.slice(0, 3).map((warning) => ({
    id: warning.id,
    title: warning.code,
    summary: warning.message,
    at: input.strategy?.generatedAt ?? new Date().toISOString(),
    source: "memory" as const,
  }));
}
