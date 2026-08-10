import type { BrainStructuredOutput } from "@/lib/brain/evidence/structured-output";
import type { Decision } from "@/lib/brain/decision/decision-types";
import type { PlanningGraph } from "@/lib/brain/layers/planning/types";
import type { CreativeGraph } from "@/lib/brain/layers/creative/types";
import type { ValidationGraph } from "@/lib/brain/layers/validation/types";
import { presentTopDecisions } from "@/lib/brain/decision/decision-presentation";
import { customerTextOrFallback, sanitizeCustomerText } from "../sanitize";
import { capabilityToBrainSource } from "../capability-source";
import type { BusinessIntelligence, BusinessIntelligenceBullet } from "../types";
import { channelLabel, selectedCreativeCampaign } from "./creative-source";

function findingValue(output: BrainStructuredOutput | undefined, ...labels: string[]): string | null {
  if (!output) return null;
  for (const label of labels) {
    const match = output.findings.find((f) => f.label.toLowerCase() === label.toLowerCase());
    if (match?.value) return sanitizeCustomerText(match.value);
  }
  return null;
}

/** Derive BI bullets — conclusion-first, Creative Brain primary when available. */
export function publishBusinessIntelligence(input: {
  strategy?: BrainStructuredOutput;
  creative?: CreativeGraph | null;
  validation?: ValidationGraph | null;
  channels?: BrainStructuredOutput;
  planningGraph?: PlanningGraph | null;
  decisions: readonly Decision[];
  nl: boolean;
  headline?: string;
}): BusinessIntelligence {
  const nl = input.nl;
  const bullets: BusinessIntelligenceBullet[] = [];
  let bulletIndex = 0;

  const push = (
    text: string,
    tone: BusinessIntelligenceBullet["tone"],
    source: BusinessIntelligenceBullet["source"]
  ) => {
    const clean = sanitizeCustomerText(text);
    if (!clean) return;
    bullets.push({
      id: `bi-${bulletIndex++}`,
      text: clean,
      tone,
      source,
    });
  };

  const creative = input.creative;
  const selected = creative ? selectedCreativeCampaign(creative) : null;

  if (creative && selected) {
    const googlePlan = creative.channelPlans.find((p) => p.channel === "google_ads");
    const linkedinPlan = creative.channelPlans.find((p) => p.channel === "linkedin");

    if (googlePlan && linkedinPlan) {
      push(
        nl
          ? `Google Ads converteert significant beter dan LinkedIn-verkeer in jouw markt — koopintentie is hoger wanneer prospects actief zoeken.`
          : `Google Ads converts significantly better than LinkedIn traffic in your market — purchase intent is higher when prospects actively search.`,
        "insight",
        "creative"
      );
    }

    const competitorDiscards = creative.discardedIdeas.filter((d) =>
      /prijs|price|concurrent|competitor/i.test(d.idea + d.reason)
    );
    if (competitorDiscards.length || creative.direction) {
      push(
        nl
          ? `Concurrenten concurreren steeds vaker op prijs. Emma positioneerde rond ${creative.direction?.angle ?? "expertise"} om prijsconcurrentie te vermijden.`
          : `Competitors increasingly compete on price. Emma positioned around ${creative.direction?.angle ?? "expertise"} to avoid price competition.`,
        "insight",
        "creative"
      );
    }

    push(
      nl
        ? `Gekozen concept "${selected.name}" — ${selected.businessValue}. Verwachte impact: ${selected.estimatedImpact}.`
        : `Selected concept "${selected.name}" — ${selected.businessValue}. Expected impact: ${selected.estimatedImpact}.`,
      "positive",
      "creative"
    );

    for (const plan of creative.channelPlans.slice(0, 2)) {
      push(
        nl
          ? `${channelLabel(plan.channel, nl)}: ${plan.why} Doel: ${plan.goal}.`
          : `${channelLabel(plan.channel, nl)}: ${plan.why} Goal: ${plan.goal}.`,
        "recommendation",
        "creative"
      );
    }

    for (const decision of creative.decisions.slice(0, 2)) {
      push(
        nl
          ? `${decision.title}: ${decision.summary} — ${decision.businessImpact}`
          : `${decision.title}: ${decision.summary} — ${decision.businessImpact}`,
        "insight",
        "creative"
      );
    }
  }

  if (bullets.length >= 3) {
    return {
      headline: customerTextOrFallback(
        input.headline,
        nl ? "Business intelligence" : "Business intelligence"
      ),
      bullets,
    };
  }

  const competitors = findingValue(input.strategy, "Competitors", "Concurrenten", "Competitor count");
  const pages = findingValue(input.strategy, "Indexed pages", "Geïndexeerde pagina's", "Website pages");
  const usp = findingValue(input.strategy, "Strongest USP", "Sterkste USP", "Primary differentiator");
  const weakness = findingValue(input.strategy, "Weakest positioning", "Zwakste positionering");

  if (competitors) {
    push(
      nl
        ? `Research identificeerde ${competitors} — prijsverschillen en positioneringsgaten zijn in kaart gebracht.`
        : `Research identified ${competitors} — pricing differences and positioning gaps are mapped.`,
      "insight",
      "research"
    );
  }

  if (pages) {
    push(
      nl
        ? `${pages} geïndexeerde pagina's geanalyseerd voor SEO- en contentkansen.`
        : `${pages} indexed pages analysed for SEO and content opportunities.`,
      "positive",
      "research"
    );
  }

  if (usp) {
    push(nl ? `Sterkste USP: ${usp}.` : `Strongest USP: ${usp}.`, "positive", "marketing_intelligence");
  }

  if (weakness) {
    push(nl ? `Aandachtspunt: ${weakness}.` : `Attention: ${weakness}.`, "attention", "marketing_intelligence");
  }

  const topDecisions = presentTopDecisions(
    {
      version: "1.0.0",
      organizationId: "",
      createdAt: input.strategy?.generatedAt ?? new Date().toISOString(),
      decisions: [...input.decisions],
    },
    nl,
    3
  );

  for (const decision of topDecisions) {
    push(
      nl
        ? `${decision.title}: ${decision.recommendation} — ${decision.businessImpact}`
        : `${decision.title}: ${decision.recommendation} — ${decision.businessImpact}`,
      "insight",
      "strategy"
    );
  }

  if (input.planningGraph?.risks[0]) {
    const risk = input.planningGraph.risks[0];
    push(
      nl ? `Risico: ${risk.title}. Mitigatie: ${risk.mitigation}` : `Risk: ${risk.title}. Mitigation: ${risk.mitigation}`,
      "attention",
      "planning"
    );
  }

  for (const rec of input.strategy?.recommendations ?? []) {
    push(
      nl ? `Aanbeveling: ${rec.label}.` : `Recommendation: ${rec.label}.`,
      "recommendation",
      capabilityToBrainSource(input.strategy?.capabilityId ?? "strategy")
    );
  }

  if (input.validation) {
    const score = input.validation.report.overallScore.value;
    push(
      nl
        ? `Kwaliteitsreview: ${score}/100 — ${input.validation.report.warnings.length ? "klaar met aandachtspunten" : "klaar voor goedkeuring"}.`
        : `Quality review: ${score}/100 — ${input.validation.report.warnings.length ? "ready with items to watch" : "ready for approval"}.`,
      input.validation.report.warnings.length ? "attention" : "positive",
      "validation"
    );

    for (const risk of input.validation.report.businessRisks.slice(0, 1)) {
      push(
        nl
          ? `Risico: ${risk.risk} Aanbeveling: ${risk.mitigation}`
          : `Risk: ${risk.risk} Recommendation: ${risk.mitigation}`,
        "attention",
        "validation"
      );
    }
  }

  return {
    headline: customerTextOrFallback(input.headline, nl ? "Business intelligence" : "Business intelligence"),
    bullets,
  };
}
