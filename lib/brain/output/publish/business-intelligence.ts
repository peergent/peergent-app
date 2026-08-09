import type { BrainStructuredOutput } from "@/lib/brain/evidence/structured-output";
import type { Decision } from "@/lib/brain/decision/decision-types";
import type { PlanningGraph } from "@/lib/brain/layers/planning/types";
import { presentTopDecisions } from "@/lib/brain/decision/decision-presentation";
import { customerTextOrFallback, sanitizeCustomerText } from "../sanitize";
import { capabilityToBrainSource } from "../capability-source";
import type { BusinessIntelligence, BusinessIntelligenceBullet } from "../types";

function findingValue(output: BrainStructuredOutput | undefined, ...labels: string[]): string | null {
  if (!output) return null;
  for (const label of labels) {
    const match = output.findings.find((f) => f.label.toLowerCase() === label.toLowerCase());
    if (match?.value) return sanitizeCustomerText(match.value);
  }
  return null;
}

/** Derive BI bullets from brain outputs — always explain, never metrics alone. */
export function publishBusinessIntelligence(input: {
  strategy?: BrainStructuredOutput;
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
    push(
      nl ? `Sterkste USP: ${usp}.` : `Strongest USP: ${usp}.`,
      "positive",
      "marketing_intelligence"
    );
  }

  if (weakness) {
    push(
      nl ? `Aandachtspunt: ${weakness}.` : `Attention: ${weakness}.`,
      "attention",
      "marketing_intelligence"
    );
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

  const headline = customerTextOrFallback(
    input.headline,
    nl ? "Business intelligence" : "Business intelligence"
  );

  return { headline, bullets };
}
