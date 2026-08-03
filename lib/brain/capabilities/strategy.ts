import type { CapabilityExecutionContext, CapabilityExecutionResult } from "./execution-context";
import { emptyBrainStructuredOutput } from "../evidence/structured-output";
import { getBrainCapability } from "./registry";
import { profileProvenance, campaignProvenance, upstreamProvenance, assumptionProvenance } from "./shared/provenance";

function isPlaceholderGoal(text: string): boolean {
  const n = text.toLowerCase().trim();
  return !n || n.length < 4 || ["custom goal", "aangepast doel"].includes(n);
}

function dedupeLabels(labels: string[]): string[] {
  const seen = new Set<string>();
  return labels.filter((l) => {
    const k = l.toLowerCase().trim();
    if (!k || seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

/** Deterministic campaign strategy — canonical contract for future LLM providers. */
export function executeStrategy(ctx: CapabilityExecutionContext): CapabilityExecutionResult {
  const def = getBrainCapability("strategy");
  const generatedAt = new Date().toISOString();
  const nl = ctx.locale === "nl";
  const profile = ctx.companySnapshot.profile;
  const campaign = ctx.campaignContext;
  const orgId = ctx.companySnapshot.organizationId;
  const base = emptyBrainStructuredOutput("strategy", def.version, generatedAt);

  if (!campaign) {
    return {
      ...base,
      warnings: [
        {
          id: "warn-no-campaign",
          code: "missing_campaign_context",
          message: nl ? "Geen campagnecontext beschikbaar." : "No campaign context available.",
          provenance: [profileProvenance(orgId, "campaign")],
        },
      ],
    };
  }

  const goals = campaign.goals.filter((g) => !isPlaceholderGoal(g));
  if (goals.length === 0 && !campaign.description.trim()) {
    return {
      ...base,
      warnings: [
        {
          id: "warn-no-goal",
          code: "missing_campaign_goal",
          message: nl
            ? "Ik heb nog een campagnedoel nodig voordat ik strategie kan bepalen."
            : "I still need a campaign goal before determining strategy.",
          provenance: [campaignProvenance(campaign.projectId, "goals")],
        },
      ],
    };
  }

  const brandOut = ctx.upstreamOutputs.brand_understanding;
  const websiteOut = ctx.upstreamOutputs.website_understanding;
  const competitorOut = ctx.upstreamOutputs.competitor_understanding;

  const businessObjective =
    goals[0] ??
    (nl ? "Campagnedoel nog te bevestigen" : "Campaign goal still to be confirmed");

  const audience = campaign.audience.trim() || profile.targetAudiences.value?.[0] || "";
  const positioning =
    profile.positioning.value ??
    brandOut?.findings.find((f) => f.id === "brand-positioning")?.value ??
    "";

  const findings: CapabilityExecutionResult["findings"] = dedupeLabels([
    nl ? "Bedrijfsdoel" : "Business objective",
    nl ? "Campagnedoel" : "Campaign objective",
    nl ? "Doelgroep" : "Target audience",
    nl ? "Doelgroepprobleem" : "Audience problem",
    nl ? "Gewenst resultaat" : "Desired outcome",
    nl ? "Positionering" : "Positioning",
    nl ? "Waardepropositie" : "Value proposition",
    nl ? "Kernboodschap" : "Core message",
    nl ? "Ondersteunende boodschappen" : "Supporting messages",
    nl ? "Campagneconcept" : "Campaign concept",
    nl ? "Customer journey" : "Customer journey",
    nl ? "Funnelfase" : "Funnel stage",
    nl ? "Contentrichting" : "Content direction",
    nl ? "Kanaalhypothese" : "Channel hypothesis",
    nl ? "CTA-strategie" : "CTA strategy",
    nl ? "KPI-kader" : "KPI framework",
    nl ? "Risico's" : "Risks",
    nl ? "Aannames" : "Assumptions",
    nl ? "Onbekenden" : "Unknowns",
  ]).map((label, i) => {
    let value = "";
    switch (label.toLowerCase()) {
      case "business objective":
      case "bedrijfsdoel":
        value = businessObjective;
        break;
      case "campaign objective":
      case "campagnedoel":
        value = campaign.description.trim() || businessObjective;
        break;
      case "target audience":
      case "doelgroep":
        value = audience || (nl ? "Nog onbekend" : "Still unknown");
        break;
      case "audience problem":
      case "doelgroepprobleem":
        value = campaign.extraContext.trim() || (nl ? "Nog te verduidelijken" : "To be clarified");
        break;
      case "desired outcome":
      case "gewenst resultaat":
        value = goals.slice(0, 2).join(" · ") || businessObjective;
        break;
      case "positioning":
      case "positionering":
        value = positioning || (nl ? "Nog onbekend" : "Still unknown");
        break;
      case "value proposition":
      case "waardepropositie":
        value =
          brandOut?.findings.find((f) => f.id === "brand-value-prop")?.value ??
          positioning ??
          (nl ? "Nog onbekend" : "Still unknown");
        break;
      case "core message":
      case "kernboodschap":
        value = nl
          ? `${campaign.companyName} helpt ${audience || "je doelgroep"} met ${businessObjective.toLowerCase()}.`
          : `${campaign.companyName} helps ${audience || "your audience"} with ${businessObjective.toLowerCase()}.`;
        break;
      case "supporting messages":
      case "ondersteunende boodschappen":
        value = profile.uniqueSellingPoints.value?.slice(0, 2).join(" · ") || (nl ? "Nog geen USP's" : "No USPs yet");
        break;
      case "campaign concept":
      case "campagneconcept":
        value = nl
          ? `Gerichte campagne voor ${campaign.companyName} richting ${audience || "de doelgroep"}.`
          : `Focused campaign for ${campaign.companyName} toward ${audience || "the audience"}.`;
        break;
      case "customer journey":
        value = nl ? "Bewustwording → overweging → actie" : "Awareness → consideration → action";
        break;
      case "funnel stage":
      case "funnelfase":
        value = nl ? "Bovenaan funnel (awareness/consideration)" : "Top of funnel (awareness/consideration)";
        break;
      case "content direction":
      case "contentrichting":
        value = nl ? "Context, bewijs, duidelijke vervolgstap" : "Context, proof, clear next step";
        break;
      case "channel hypothesis":
      case "kanaalhypothese":
        value = campaign.selectedChannels.length
          ? campaign.selectedChannels.join(", ")
          : nl
            ? "Kanalen nog te kiezen"
            : "Channels still to be selected";
        break;
      case "cta strategy":
      case "cta-strategie":
        value = /demo|lead/i.test(`${goals.join(" ")} ${campaign.description}`)
          ? nl
            ? "Stuur naar demo-aanvraag"
            : "Drive to demo request"
          : nl
            ? "Eén primaire CTA per kanaal"
            : "One primary CTA per channel";
        break;
      case "kpi framework":
      case "kpi-kader":
        value = nl
          ? "Planningaannname: engagement, clicks, conversies (geen numerieke belofte)"
          : "Planning assumption: engagement, clicks, conversions (no numeric promise)";
        break;
      case "risks":
      case "risico's":
        value = nl ? "Onvolledige merk- of concurrentcontext" : "Incomplete brand or competitor context";
        break;
      case "assumptions":
      case "aannames":
        value = nl ? "Doelgroep en doel sluiten aan op ingevulde campagne" : "Audience and goal match supplied campaign input";
        break;
      case "unknowns":
      case "onbekenden":
        value = [
          !websiteOut?.findings.length ? (nl ? "website" : "website") : null,
          !competitorOut?.findings.length ? (nl ? "concurrenten" : "competitors") : null,
        ]
          .filter(Boolean)
          .join(", ") || (nl ? "Geen" : "None");
        break;
      default:
        value = label;
    }
    return {
      id: `strategy-${i + 1}`,
      label,
      value,
      confidence: audience && goals.length ? ("medium" as const) : ("low" as const),
      provenance: [campaignProvenance(campaign.projectId, label)],
    };
  });

  const decisions = [
    {
      id: "dec-strategy-rec",
      label: nl ? "Aanbevolen richting" : "Recommended direction",
      rationale: nl
        ? "Strategie gebaseerd op bevestigde campagne-input en beschikbare bedrijfscontext."
        : "Strategy based on confirmed campaign input and available company context.",
      confidence: "medium" as const,
      provenance: [
        campaignProvenance(campaign.projectId, "strategy"),
        ...(brandOut ? [upstreamProvenance("brand_understanding", "brand-positioning")] : []),
      ],
    },
  ];

  return {
    ...base,
    findings,
    decisions,
    recommendations: [
      {
        id: "rec-strategy-next",
        label: nl ? "Volgende stap: kanalen kiezen" : "Next step: select channels",
        priority: "high",
        provenance: [campaignProvenance(campaign.projectId, "strategy")],
      },
    ],
    warnings: !websiteOut?.findings.length
      ? [
          {
            id: "warn-strategy-website",
            code: "website_limitation",
            message: nl
              ? "Websitecontext beperkt — strategie gebruikt campagne-input."
              : "Website context limited — strategy uses campaign input.",
            provenance: [assumptionProvenance("website_unavailable")],
          },
        ]
      : [],
    actionProposals: [
      {
        id: "act-strategy-approve",
        actionType: "approve_strategy",
        label: nl ? "Strategie bevestigen" : "Confirm strategy",
        requiresApproval: true,
        provenance: [campaignProvenance(campaign.projectId, "strategy")],
      },
    ],
  };
}
