import type { CompanySnapshot } from "../company/snapshot";
import { localizeUnknownFieldKeys } from "../context/missing-information";
import type { BrainStructuredOutput } from "../evidence/structured-output";
import { emptyBrainStructuredOutput } from "../evidence/structured-output";
import { getBrainCapability } from "../capabilities/registry";

export type CompanyUnderstandingInput = {
  companySnapshot: CompanySnapshot;
  locale?: "nl" | "en" | null;
};

const UNKNOWN_MESSAGE = {
  en: "I don't know yet — there isn't enough confirmed company information.",
  nl: "Dat weet ik nog niet — er is nog niet genoeg bevestigde bedrijfsinformatie.",
};

/**
 * Deterministic company_understanding — no LLM.
 * Returns honest unknowns instead of inventing facts.
 */
export function executeCompanyUnderstanding(
  input: CompanyUnderstandingInput
): BrainStructuredOutput {
  const def = getBrainCapability("company_understanding");
  const generatedAt = new Date().toISOString();
  const nl = input.locale === "nl";
  const snapshot = input.companySnapshot;
  const profile = snapshot.profile;

  const base = emptyBrainStructuredOutput("company_understanding", def.version, generatedAt);

  if (input.companySnapshot.knownFacts.length === 0) {
    return {
      ...base,
      warnings: [
        {
          id: "warn-unknown-company",
          code: "insufficient_company_context",
          message: nl ? UNKNOWN_MESSAGE.nl : UNKNOWN_MESSAGE.en,
          provenance: [{ kind: "company_profile", refId: snapshot.organizationId }],
        },
      ],
    };
  }

  const findings = input.companySnapshot.knownFacts.map((fact) => ({
    id: fact.id,
    label: fact.label,
    value: fact.value,
    confidence: profile.companyName.customerConfirmed ? ("high" as const) : ("medium" as const),
    provenance: [fact.provenance],
  }));

  const decisions = profile.positioning.value
    ? [
        {
          id: "dec-positioning",
          label: nl ? "Positionering" : "Positioning",
          rationale: profile.positioning.value,
          confidence: profile.positioning.customerConfirmed ? ("high" as const) : ("medium" as const),
          provenance: [
            {
              kind: "company_profile" as const,
              refId: `positioning:${snapshot.organizationId}`,
              label: profile.positioning.source,
            },
          ],
        },
      ]
    : [];

  const recommendations: BrainStructuredOutput["recommendations"] =
    snapshot.unknowns.includes("target_audiences")
      ? [
          {
            id: "rec-audience",
            label: nl ? "Bevestig je doelgroep" : "Confirm your target audience",
            priority: "high",
            provenance: [{ kind: "company_profile", refId: snapshot.organizationId }],
          },
        ]
      : [];

  return {
    ...base,
    findings,
    decisions,
    recommendations,
    warnings: snapshot.unknowns.length
      ? [
          {
            id: "warn-gaps",
            code: "company_gaps",
            message: nl
              ? `Nog onbekend: ${localizeUnknownFieldKeys(snapshot.unknowns, true)}`
              : `Still unknown: ${localizeUnknownFieldKeys(snapshot.unknowns, false)}`,
            provenance: [{ kind: "company_profile", refId: snapshot.organizationId }],
          },
        ]
      : [],
  };
}
