import type { CapabilityExecutionContext, CapabilityExecutionResult } from "./execution-context";
import { emptyBrainStructuredOutput } from "../evidence/structured-output";
import { getBrainCapability } from "./registry";
import { profileProvenance, campaignProvenance } from "./shared/provenance";

export function executeCompetitorUnderstanding(
  ctx: CapabilityExecutionContext
): CapabilityExecutionResult {
  const def = getBrainCapability("competitor_understanding");
  const generatedAt = new Date().toISOString();
  const nl = ctx.locale === "nl";
  const profile = ctx.companySnapshot.profile;
  const orgId = ctx.companySnapshot.organizationId;
  const campaign = ctx.campaignContext;
  const base = emptyBrainStructuredOutput("competitor_understanding", def.version, generatedAt);

  const competitors = [
    ...(campaign?.competitors ?? []).map((c) => ({ name: c.name, url: c.url, source: "campaign" as const })),
    ...(profile.mainCompetitors.value ?? []).map((name) => ({
      name,
      url: undefined,
      source: profile.mainCompetitors.source,
    })),
  ];

  const unique = new Map<string, (typeof competitors)[number]>();
  for (const c of competitors) {
    const key = c.name.trim().toLowerCase();
    if (key && !unique.has(key)) unique.set(key, c);
  }
  const list = [...unique.values()];

  if (campaign?.competitorsSkipped) {
    return {
      ...base,
      warnings: [
        {
          id: "warn-competitors-skipped",
          code: "competitors_skipped",
          message: nl
            ? "Concurrenten zijn overgeslagen — geen marktvergelijking toegevoegd."
            : "Competitors were skipped — no market comparison added.",
          provenance: campaign ? [campaignProvenance(campaign.projectId, "competitorsSkipped")] : [],
        },
      ],
    };
  }

  if (list.length === 0) {
    return {
      ...base,
      warnings: [
        {
          id: "warn-no-competitors",
          code: "competitors_missing",
          message: nl
            ? "Ik heb nog geen concurrenten — voeg ze toe om positionering te verfijnen."
            : "I still need competitors — add them to refine positioning.",
          provenance: [profileProvenance(orgId, "mainCompetitors")],
        },
      ],
    };
  }

  const findings = list.map((c, i) => ({
    id: `competitor-${i + 1}`,
    label: nl ? "Concurrent" : "Competitor",
    value: c.url ? `${c.name} (${c.url})` : c.name,
    confidence: c.source === "customer_confirmed" ? ("high" as const) : ("medium" as const),
    provenance: [
      c.source === "campaign"
        ? campaignProvenance(campaign!.projectId, "competitors")
        : profileProvenance(orgId, "mainCompetitors", profile.mainCompetitors.source),
    ],
  }));

  const recommendations = list.length > 0
    ? [
        {
          id: "rec-diff-merged",
          label: nl
            ? `Differentieer t.o.v. ${list.map((c) => c.name).join(" en ")} door te focussen op wat ${profile.companyName.value ?? campaign?.companyName ?? "jouw bedrijf"} uniek maakt voor deze campagne.`
            : `Differentiate vs ${list.map((c) => c.name).join(" and ")} by focusing on what makes ${profile.companyName.value ?? campaign?.companyName ?? "your company"} unique for this campaign.`,
          priority: "medium" as const,
          provenance: list.map((c) =>
            c.source === "campaign"
              ? campaignProvenance(campaign!.projectId, "competitors")
              : profileProvenance(orgId, "mainCompetitors")
          ),
        },
      ]
    : [];

  return {
    ...base,
    findings: [
      ...findings,
      {
        id: "competitor-limitation",
        label: nl ? "Beperking" : "Limitation",
        value: nl
          ? "Geen live marktonderzoek — alleen door jou opgegeven concurrenten."
          : "No live market research — only customer-supplied competitors.",
        confidence: "high",
        provenance: [profileProvenance(orgId, "mainCompetitors")],
      },
    ],
    recommendations,
  };
}
