import type { BrainCapabilityId } from "../capabilities/registry";

/** Emma progress labels mapped to Brain capability execution order. */
const CAPABILITY_PROGRESS_LABEL: Partial<
  Record<BrainCapabilityId, { nl: string; en: string }>
> = {
  company_understanding: {
    nl: "Emma verzamelt context",
    en: "Emma is gathering context",
  },
  brand_understanding: {
    nl: "Emma verzamelt context",
    en: "Emma is gathering context",
  },
  website_understanding: {
    nl: "Emma onderzoekt website",
    en: "Emma is reviewing the website",
  },
  market_understanding: {
    nl: "Emma verzamelt context",
    en: "Emma is gathering context",
  },
  competitor_understanding: {
    nl: "Emma vergelijkt concurrenten",
    en: "Emma is comparing competitors",
  },
  strategy: {
    nl: "Emma ontwikkelt strategie",
    en: "Emma is developing strategy",
  },
  channel_planning: {
    nl: "Emma bepaalt kanalen",
    en: "Emma is selecting channels",
  },
  creative_generation: {
    nl: "Emma maakt deliverables",
    en: "Emma is creating deliverables",
  },
  optimization: {
    nl: "Emma analyseert prestaties",
    en: "Emma is analyzing performance",
  },
};

const FINALIZE_LABEL = {
  nl: "Emma controleert kwaliteit",
  en: "Emma is checking quality",
};

const READY_LABEL = {
  nl: "Resultaat klaar",
  en: "Result ready",
};

export function brainCapabilityProgressLabel(
  capabilityId: BrainCapabilityId,
  locale?: string | null
): string {
  const nl = locale === "nl";
  const labels = CAPABILITY_PROGRESS_LABEL[capabilityId];
  if (!labels) return nl ? "Emma werkt…" : "Emma is working…";
  return nl ? labels.nl : labels.en;
}

export function brainFinalizeProgressLabel(locale?: string | null): string {
  return locale === "nl" ? FINALIZE_LABEL.nl : FINALIZE_LABEL.en;
}

export function brainReadyProgressLabel(locale?: string | null): string {
  return locale === "nl" ? READY_LABEL.nl : READY_LABEL.en;
}
