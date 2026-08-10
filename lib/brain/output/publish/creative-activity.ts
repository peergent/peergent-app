import type { CreativeGraph } from "@/lib/brain/layers/creative/types";
import { capabilityToBrainSource } from "../capability-source";
import { customerTextOrFallback, sanitizeCustomerText } from "../sanitize";
import type { LiveActivityEvent } from "../types";

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

const PHASE_ACTIVITY: Record<
  string,
  { en: { title: string; subtitle: string }; nl: { title: string; subtitle: string }; tone: LiveActivityEvent["tone"] }
> = {
  understand_business: {
    en: { title: "Business context understood", subtitle: "Grounded creative in business reality before messaging." },
    nl: { title: "Bedrijfscontext begrepen", subtitle: "Creative grounded in business reality before messaging." },
    tone: "insight",
  },
  understand_audience: {
    en: { title: "Audience mapped", subtitle: "Who receives the message and what they need to hear." },
    nl: { title: "Doelgroep in kaart gebracht", subtitle: "Wie de boodschap ontvangt en wat ze moeten horen." },
    tone: "insight",
  },
  find_positioning: {
    en: { title: "Positioning selected", subtitle: "Strongest angle chosen — weak alternatives rejected." },
    nl: { title: "Positionering gekozen", subtitle: "Sterkste hoek gekozen — zwakke alternatieven afgewezen." },
    tone: "insight",
  },
  generate_campaign_concepts: {
    en: { title: "Campaign concepts generated", subtitle: "Multiple concepts evaluated — one selected for business fit." },
    nl: { title: "Campagneconcepten gegenereerd", subtitle: "Meerdere concepten beoordeeld — één gekozen op business fit." },
    tone: "success",
  },
  generate_messaging: {
    en: { title: "Messaging framework built", subtitle: "Headline, proof, objections, and trust builders structured." },
    nl: { title: "Messaging framework opgebouwd", subtitle: "Headline, proof, bezwaren en trust builders gestructureerd." },
    tone: "success",
  },
  generate_channel_strategy: {
    en: { title: "Channel strategy defined", subtitle: "Each channel matched to audience, goal, and priority." },
    nl: { title: "Kanaalstrategie vastgelegd", subtitle: "Elk kanaal afgestemd op doelgroep, doel en prioriteit." },
    tone: "success",
  },
  generate_deliverables: {
    en: { title: "Creative deliverables specified", subtitle: "Asset specs ready — not published yet." },
    nl: { title: "Creative deliverables gespecificeerd", subtitle: "Asset-specificaties klaar — nog niet gepubliceerd." },
    tone: "success",
  },
};

/** Activity events from Creative Brain phases and discarded ideas. */
export function publishCreativeActivityEvents(input: {
  creative: CreativeGraph | null;
  nl: boolean;
  now: Date;
}): readonly LiveActivityEvent[] {
  if (!input.creative) return [];

  const events: LiveActivityEvent[] = [];

  for (const phase of input.creative.phases) {
    const template = PHASE_ACTIVITY[phase.phase];
    if (!template) continue;
    const copy = input.nl ? template.nl : template.en;
    events.push({
      id: `creative-phase-${phase.phase}`,
      timestamp: phase.completedAt,
      timeLabel: relativeTimeLabel(phase.completedAt, input.nl, input.now),
      title: copy.title,
      subtitle: sanitizeCustomerText(phase.summary) || copy.subtitle,
      tone: template.tone,
      sourceBrain: "creative",
      whyItMatters: input.nl
        ? "Emma denkt stap voor stap — geen losse copy."
        : "Emma thinks step by step — not disconnected copy.",
      href: null,
    });
  }

  for (const discarded of input.creative.discardedIdeas.slice(0, 3)) {
    events.push({
      id: `creative-discarded-${discarded.idea.slice(0, 20)}`,
      timestamp: input.creative.createdAt,
      timeLabel: relativeTimeLabel(input.creative.createdAt, input.nl, input.now),
      title: input.nl ? "Concept afgewezen" : "Concept rejected",
      subtitle: customerTextOrFallback(discarded.idea, discarded.reason),
      tone: "attention",
      sourceBrain: "creative",
      whyItMatters: customerTextOrFallback(discarded.reason, ""),
      href: null,
    });
  }

  const selected = input.creative.campaigns.find((c) => c.selected);
  if (selected) {
    events.unshift({
      id: "creative-selected-concept",
      timestamp: input.creative.createdAt,
      timeLabel: relativeTimeLabel(input.creative.createdAt, input.nl, input.now),
      title: input.nl ? `Gekozen: "${selected.name}"` : `Selected: "${selected.name}"`,
      subtitle: customerTextOrFallback(selected.keyMessage, selected.name),
      tone: "success",
      sourceBrain: "creative",
      whyItMatters: customerTextOrFallback(selected.businessValue, selected.estimatedImpact),
      href: null,
    });
  }

  events.push({
    id: "creative-waiting-approval",
    timestamp: input.creative.createdAt,
    timeLabel: relativeTimeLabel(input.creative.createdAt, input.nl, input.now),
    title: input.nl ? "Wacht op goedkeuring" : "Waiting for approval",
    subtitle: input.nl
      ? "Campagneconcept en creative richting klaar voor review."
      : "Campaign concept and creative direction ready for review.",
    tone: "attention",
    sourceBrain: "creative",
    whyItMatters: input.nl
      ? "Publicatie start pas na jouw goedkeuring."
      : "Publishing begins only after your approval.",
    href: null,
  });

  return events.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
}

/** Merge upstream capability events with creative phase events — creative wins on overlap. */
export function mergeActivityEvents(
  upstream: readonly LiveActivityEvent[],
  creative: readonly LiveActivityEvent[]
): readonly LiveActivityEvent[] {
  if (creative.length === 0) return upstream;
  const withoutGenericCreative = upstream.filter(
    (e) => e.id !== "activity-creative_generation"
  );
  return [...creative, ...withoutGenericCreative].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
}

export { capabilityToBrainSource };
