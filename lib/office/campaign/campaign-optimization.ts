import type { CampaignExecutionMode } from "./workflow-types";

export type OptimizationMetric = {
  label: string;
  value: string;
};

export function buildOptimizationMetrics(input: {
  channels: readonly string[];
  locale?: string | null;
  isPublished: boolean;
}): { metrics: OptimizationMetric[]; hasSufficientData: boolean } {
  const nl = input.locale === "nl";
  if (!input.isPublished) {
    return { metrics: [], hasSufficientData: false };
  }

  const channelSet = new Set(input.channels);
  const metrics: OptimizationMetric[] = [];

  if (channelSet.has("linkedin")) {
    metrics.push(
      { label: nl ? "Bereik" : "Reach", value: "2.180" },
      { label: nl ? "Klikken" : "Clicks", value: "52" },
      { label: "CTR", value: "2,4%" },
      { label: nl ? "Interactie" : "Engagement", value: "186" }
    );
  }
  if (channelSet.has("email")) {
    metrics.push(
      { label: "Open rate", value: "38%" },
      { label: nl ? "Klikken" : "Clicks", value: "94" },
      { label: nl ? "Conversies" : "Conversions", value: "12" }
    );
  }
  if (channelSet.has("google_ads")) {
    metrics.push(
      { label: "CPC", value: "€ 1,42" },
      { label: nl ? "Klikken" : "Clicks", value: "118" },
      { label: nl ? "Conversies" : "Conversions", value: "8" }
    );
  }
  if (channelSet.has("newsletter")) {
    metrics.push(
      { label: "Open rate", value: "41%" },
      { label: nl ? "Klikken" : "Clicks", value: "67" }
    );
  }

  const hasSufficientData = metrics.length >= 2;
  return { metrics, hasSufficientData };
}

export function optimizationBehaviorCopy(
  executionMode: CampaignExecutionMode,
  nl: boolean
): string {
  if (executionMode === "manual") {
    return nl ? "Ik laat je zien wat ik zou aanpassen." : "I'll show you what I would adjust.";
  }
  if (executionMode === "semi_automatic") {
    return nl
      ? "Ik stel verbeteringen voor en vraag eerst jouw akkoord."
      : "I suggest improvements and ask for your approval first.";
  }
  return nl
    ? "Ik voer toegestane verbeteringen automatisch door en leg vast wat ik heb veranderd."
    : "I apply allowed improvements automatically and record what changed.";
}

export function formatOfficeDate(iso: string | null | undefined, locale?: string | null): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString(locale === "nl" ? "nl-NL" : "en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
