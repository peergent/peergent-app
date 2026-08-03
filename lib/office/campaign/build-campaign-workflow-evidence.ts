import type { MarketingPeerDomainInput } from "@/lib/peer-experience/marketing/view-models/marketing-peer-domain-input";
import type { MarketingProject } from "@/lib/peer-experience/marketing/projects/types";
import {
  buildCampaignContext,
  isSeedCampaign,
  type CampaignContext,
} from "./campaign-context";
import { buildStructuredStrategyEvidence } from "./build-structured-strategy-evidence";
import { generateSimulatedCopy } from "./generate-campaign-simulation";
import { readDemoCampaignOverlay } from "@/lib/office/demo/demo-campaign-domain-overlay";
import { buildBrainStepEvidence } from "@/lib/brain/integration/build-brain-step-evidence";
import type { EvidenceBundle } from "./build-campaign-workflow-evidence-types";
import type { CampaignWorkflowStepId } from "./workflow-types";

export type { EvidenceBundle } from "./build-campaign-workflow-evidence-types";

function isNl(locale?: string | null): boolean {
  return locale === "nl";
}

function resolveContext(
  project: MarketingProject,
  domainInput: MarketingPeerDomainInput
): CampaignContext {
  const overlay = readDemoCampaignOverlay(domainInput);
  const stored = overlay.demoCampaignContexts?.[project.id];
  if (stored) return stored;
  return buildCampaignContext({ project, domainInput });
}

function dedupeItems(items: string[], exclude: Set<string>): string[] {
  return items.filter((item, index, arr) => {
    if (!item.trim()) return false;
    if (exclude.has(item.trim())) return false;
    return arr.indexOf(item) === index;
  });
}

/**
 * Grounded workflow evidence from CampaignContext — demo and live share this path.
 */
export function buildCampaignStepEvidence(input: {
  stepId: CampaignWorkflowStepId;
  peerId?: string;
  project: MarketingProject;
  domainInput: MarketingPeerDomainInput;
  locale?: string | null;
}): EvidenceBundle | null {
  const { stepId, project, domainInput } = input;
  const peerId = input.peerId ?? project.peerId;
  const nl = isNl(input.locale);
  const ctx = resolveContext(project, domainInput);

  if (stepId === "business_analyzed" || stepId === "website_analyzed") {
    if (stepId === "website_analyzed" && ctx.websiteState === "skipped") {
      // Keep explicit skipped UX — brain path does not apply.
    } else {
      const brainEvidence = buildBrainStepEvidence({
        stepId,
        peerId,
        project,
        domainInput,
        locale: input.locale,
      });
      if (brainEvidence) return brainEvidence;
      if (stepId === "business_analyzed" && ctx.companyContextState === "missing") return null;
      if (stepId === "website_analyzed" && ctx.websiteState === "missing") return null;
    }
  }

  /** Sprint 5 — runtime-backed evidence with office simulation fallback below. */
  const brainBackedSteps: CampaignWorkflowStepId[] = [
    "competitors_analyzed",
    "strategy_determined",
    "channels_selected",
    "deliverables_created",
    "optimizing",
  ];
  if (brainBackedSteps.includes(stepId) && peerId === "demo") {
    const brainReady =
      (stepId !== "competitors_analyzed" || ctx.competitorContextState !== "missing") &&
      (stepId !== "strategy_determined" || ctx.companyContextState !== "missing");
    if (brainReady) {
      const brainEvidence = buildBrainStepEvidence({
        stepId,
        peerId,
        project,
        domainInput,
        locale: input.locale,
      });
      if (brainEvidence && !brainEvidence.sections.some((s) => s.id === "needs-info")) {
        return brainEvidence;
      }
    }
    // Fallback: office simulation paths below (documented compatibility boundary).
  }

  const seed = isSeedCampaign(project.id);
  const understanding = domainInput.understanding;
  const setup = project.campaignSetup;
  const userText = new Set(
    [setup?.description, project.rawRequest, project.goal, ctx.audience, ctx.description].filter(
      Boolean
    ) as string[]
  );

  switch (stepId) {
    case "business_analyzed": {
      if (ctx.companyContextState === "missing") return null;
      const items = seed
        ? dedupeItems(
            [
              understanding?.brand?.positioningStatement ?? "",
              understanding?.brand?.valueProposition ?? "",
              ...(understanding?.brand?.keyMessages ?? []),
            ],
            userText
          )
        : dedupeItems(
            [
              ctx.description,
              ctx.audience ? (nl ? `Doelgroep: ${ctx.audience}` : `Audience: ${ctx.audience}`) : "",
              ctx.goals.length ? ctx.goals.join(" · ") : "",
            ],
            userText
          );
      if (items.length === 0) return null;
      return {
        title: nl ? "Bedrijfsanalyse" : "Business analysis",
        intro: nl
          ? "Ik heb je input en bedrijfscontext gebruikt om te begrijpen wat je wilt bereiken."
          : "I used your input and business context to understand what you want to achieve.",
        sections: [
          {
            id: "context",
            title: nl ? "Wat ik begrijp" : "What I understand",
            items,
          },
        ],
      };
    }

    case "website_analyzed": {
      if (ctx.websiteState === "missing") return null;
      if (ctx.websiteState === "skipped") {
        return {
          title: nl ? "Website" : "Website",
          intro: nl
            ? "Website-analyse overgeslagen op jouw verzoek. Ik ga verder met wat je al hebt ingevuld."
            : "Website analysis skipped at your request. I continue with what you already provided.",
          sections: [
            {
              id: "skipped",
              title: nl ? "Status" : "Status",
              items: [
                nl
                  ? "We gaan verder zonder website-analyse."
                  : "We continue without website analysis.",
              ],
            },
          ],
        };
      }
      const isSimulated = ctx.websiteSource === "supplied_by_customer";
      const urlDisplay = ctx.websiteUrl ?? "—";
      const copy = seed ? null : generateSimulatedCopy(ctx);
      return {
        title: nl ? "Websitecontext" : "Website context",
        intro: isSimulated
          ? nl
            ? `Je hebt ${urlDisplay} opgegeven. Omdat er nog geen echte websitecrawl is uitgevoerd, baseer ik deze campagne voorlopig op je campagnebeschrijving en doelgroep.`
            : `You supplied ${urlDisplay}. Because no real website crawl was performed yet, this campaign is based on your campaign description and audience for now.`
          : nl
            ? "Ik heb je opgegeven websitecontext verwerkt. Hieronder zie je welke conclusies ik wel en niet kan trekken."
            : "I processed your supplied website context. Below is what I can and cannot conclude.",
        sections: [
          {
            id: "source",
            title: nl ? "Bron" : "Source",
            items: [
              nl ? `Opgegeven URL: ${urlDisplay}` : `Supplied URL: ${urlDisplay}`,
              nl
                ? "Geen echte websitecrawl uitgevoerd — context komt uit campagne-input."
                : "No real website crawl performed — context comes from campaign input.",
            ],
          },
          {
            id: "findings",
            title: nl ? "Wat ik gebruik voor deze campagne" : "What I use for this campaign",
            items: seed
              ? nl
                ? [
                    "Homepage benadrukt snel live gaan — consistent met campagnedoel.",
                    "Case studies missen concrete doorlooptijden; kans voor social proof.",
                  ]
                : [
                    "Homepage leads with time-to-live — aligned with campaign goal.",
                    "Case studies lack concrete timelines; opportunity for social proof.",
                  ]
              : [
                  nl
                    ? `Bedrijf: ${ctx.companyName}.`
                    : `Company: ${ctx.companyName}.`,
                  ctx.description.trim()
                    ? nl
                      ? `Campagnebeschrijving: ${ctx.description.trim()}`
                      : `Campaign description: ${ctx.description.trim()}`
                    : nl
                      ? "Campagnebeschrijving: nog niet ingevuld."
                      : "Campaign description: not yet provided.",
                  ctx.audience.trim()
                    ? nl
                      ? `Doelgroep: ${ctx.audience.trim()}`
                      : `Audience: ${ctx.audience.trim()}`
                    : nl
                      ? "Doelgroep: nog niet scherp beschreven."
                      : "Audience: not yet described sharply.",
                ].filter(Boolean),
          },
          {
            id: "unknown",
            title: nl ? "Nog onbekend zonder crawl" : "Still unknown without a crawl",
            items: [
              nl
                ? "Exacte paginastructuur en live content op de website."
                : "Exact page structure and live content on the website.",
              nl
                ? "Actuele social proof en klantcases op de site."
                : "Current social proof and customer cases on the site.",
            ],
          },
          {
            id: "influence",
            title: nl ? "Invloed op campagne" : "Campaign influence",
            items: [
              nl
                ? `Boodschap en kanalen worden afgestemd op ${ctx.audience || "je doelgroep"}.`
                : `Messaging and channels align with ${ctx.audience || "your audience"}.`,
              ...(copy
                ? [
                    nl
                      ? `Kernboodschap: ${copy.linkedinBody.split("\n")[0]?.slice(0, 80) ?? copy.objective}`
                      : `Core message: ${copy.linkedinBody.split("\n")[0]?.slice(0, 80) ?? copy.objective}`,
                  ]
                : []),
            ],
          },
        ],
      };
    }

    case "competitors_analyzed": {
      if (ctx.competitorContextState === "missing") return null;
      if (ctx.competitorContextState === "skipped") {
        return {
          title: nl ? "Concurrentieanalyse" : "Competitor analysis",
          intro: nl
            ? "Concurrentieanalyse overgeslagen op jouw verzoek."
            : "Competitor analysis skipped at your request.",
          sections: [
            {
              id: "skipped",
              title: nl ? "Status" : "Status",
              items: [
                nl
                  ? "We gaan verder zonder vergelijking met concurrenten."
                  : "We continue without competitor comparison.",
              ],
            },
          ],
        };
      }
      const supplied = ctx.competitors;
      const domainCompetitors = understanding?.competitors ?? [];
      const competitorNames =
        supplied.length > 0
          ? supplied
          : seed
            ? domainCompetitors.map((c) => ({ name: c.name, url: undefined }))
            : [];

      if (competitorNames.length === 0) return null;

      const copy = seed ? null : generateSimulatedCopy(ctx);
      return {
        title: nl ? "Concurrentieanalyse" : "Competitor analysis",
        intro: nl
          ? "Ik heb je opgegeven concurrenten vergeleken met je campagnedoel — alleen op basis van wat jij hebt aangeleverd."
          : "I compared your supplied competitors against your campaign goal — only from what you provided.",
        sections: [
          {
            id: "competitors",
            title: nl ? "Concurrenten" : "Competitors",
            items: competitorNames.map((c) =>
              c.url ? `${c.name} (${c.url})` : c.name
            ),
          },
          {
            id: "positioning",
            title: nl ? "Positionering" : "Positioning",
            items: competitorNames.map((c) =>
              nl
                ? `${c.name}: vergelijkbaar aanbod, andere nadruk — ${ctx.companyName} kan zich onderscheiden via ${ctx.goals[0] ?? "jouw campagnedoel"}.`
                : `${c.name}: similar offer, different emphasis — ${ctx.companyName} can differentiate via ${ctx.goals[0] ?? "your campaign goal"}.`
            ),
          },
          {
            id: "recommendation",
            title: nl ? "Aanbeveling" : "Recommendation",
            items: [
              copy?.objective ??
                (nl
                  ? `Focus op ${ctx.audience || "je doelgroep"} met duidelijke differentiatie t.o.v. ${competitorNames[0]?.name ?? "concurrenten"}.`
                  : `Focus on ${ctx.audience || "your audience"} with clear differentiation vs ${competitorNames[0]?.name ?? "competitors"}.`),
            ],
          },
        ],
      };
    }

    case "strategy_determined": {
      if (seed) {
        return {
          title: nl ? "Strategie" : "Strategy",
          intro: nl
            ? "Ik heb genoeg informatie om een eerste strategie voor te stellen."
            : "I have enough information to propose an initial strategy.",
          sections: [
            {
              id: "market_context",
              title: nl ? "Markt- en contextobservatie" : "Market observation",
              items: nl
                ? ["Warmtepompseizoen start in Q4 — installateurs plannen nu al capaciteit."]
                : ["Heat pump season starts in Q4 — installers are already planning capacity."],
            },
          ],
        };
      }
      return buildStructuredStrategyEvidence(ctx, nl);
    }

    case "channels_selected": {
      const copy = generateSimulatedCopy(ctx);
      const selected =
        ctx.selectedChannels.length > 0
          ? ctx.selectedChannels
          : resolveDeliverableChannelsFromMode(ctx);

      const selectedItems = selected.map((ch) => {
        const rationale = copy.channelRationale[ch] ?? ch;
        const label = channelLabel(ch, nl);
        return nl ? `${label} — ${rationale}` : `${label} — ${rationale}`;
      });

      return {
        title: nl ? "Kanalen" : "Channels",
        intro: nl
          ? "Op basis van de strategie heb ik bepaald waar we jouw doelgroep het beste kunnen bereiken. Als jij akkoord bent, begin ik met het maken van de campagneonderdelen."
          : "Based on the strategy I determined where we can best reach your audience. Once you approve, I'll create the campaign deliverables.",
        sections: [
          {
            id: "selected",
            title: nl ? "Gekozen kanalen" : "Selected channels",
            items: selectedItems.length
              ? selectedItems
              : [nl ? "LinkedIn en e-mail als startpunt." : "LinkedIn and email as a starting point."],
          },
        ],
      };
    }

    default:
      return null;
  }
}

function channelLabel(channel: string, nl: boolean): string {
  const map: Record<string, { en: string; nl: string }> = {
    linkedin: { en: "LinkedIn", nl: "LinkedIn" },
    email: { en: "Email", nl: "E-mail" },
    google_ads: { en: "Google Ads", nl: "Google Ads" },
    newsletter: { en: "Newsletter", nl: "Nieuwsbrief" },
    website_landing: { en: "Landing page", nl: "Landingspagina" },
    instagram: { en: "Instagram", nl: "Instagram" },
    blog: { en: "Blog", nl: "Blog" },
  };
  return map[channel]?.[nl ? "nl" : "en"] ?? channel;
}

function resolveDeliverableChannelsFromMode(ctx: CampaignContext): string[] {
  if (ctx.campaignMode === "manual" && ctx.selectedChannels.length > 0) {
    return [...ctx.selectedChannels];
  }
  const lead =
    ctx.goals.some((g) => /lead|demo/i.test(g)) || /lead|demo/i.test(ctx.description);
  return lead
    ? ["linkedin", "email", "google_ads", "website_landing"]
    : ["linkedin", "email", "newsletter"];
}

export function buildWebsiteMissingPrompt(ctx: CampaignContext, nl: boolean): {
  message: string;
  addWebsiteLabel: string;
  skipLabel: string;
} {
  return {
    message: nl
      ? "Om een sterke campagne te maken wil ik eerst je website begrijpen. Daarmee kan ik je aanbod, positionering en tone of voice beter meenemen."
      : "To build a strong campaign I first want to understand your website. That helps me align with your offer, positioning, and tone of voice.",
    addWebsiteLabel: nl ? "Website toevoegen" : "Add website",
    skipLabel: nl ? "Doorgaan zonder website" : "Continue without website",
  };
}

export function buildCompetitorMissingPrompt(ctx: CampaignContext, nl: boolean): {
  message: string;
  addLabel: string;
  skipLabel: string;
} {
  return {
    message: nl
      ? "Ik heb nog geen concurrenten om mee te vergelijken. Ik kan verder zonder vergelijking, of je kunt één of meer concurrenten toevoegen."
      : "I don't have competitors to compare yet. I can continue without comparison, or you can add one or more competitors.",
    addLabel: nl ? "Concurrent toevoegen" : "Add competitor",
    skipLabel: nl ? "Doorgaan zonder concurrentieanalyse" : "Continue without competitor analysis",
  };
}
