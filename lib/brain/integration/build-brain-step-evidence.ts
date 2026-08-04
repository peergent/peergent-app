import type { EvidenceBundle } from "@/lib/office/campaign/build-campaign-workflow-evidence-types";
import type { CampaignWorkflowStepId } from "@/lib/office/campaign/workflow-types";
import type { MarketingPeerDomainInput } from "@/lib/peer-experience/marketing/view-models/marketing-peer-domain-input";
import type { MarketingProject } from "@/lib/peer-experience/marketing/projects/types";
import { presentBrainOutputForCampaign } from "../presentation/campaign-evidence-adapter";
import { formatMissingInformationMessage } from "../context/missing-information";
import { buildCampaignContext } from "@/lib/office/campaign/campaign-context";
import type { BrainRunResult } from "../runtime/run-result";
import type { ContextAssemblyResult } from "../context/assembly-types";
import {
  executeBrainForWorkflowStep,
  executeBrainForWorkflowStepSync,
  primaryCapabilityForWorkflowStep,
  type ExecuteBrainForWorkflowStepOptions,
  type ExecuteBrainForWorkflowStepResult,
} from "./execute-brain-for-workflow-step";
import {
  extractBrainDevDiagnostics,
  isBrainDevDiagnosticsEnabled,
} from "./brain-dev-diagnostics";

export type BuildBrainStepEvidenceInput = {
  stepId: CampaignWorkflowStepId;
  peerId: string;
  project: MarketingProject;
  domainInput: MarketingPeerDomainInput;
  locale?: string | null;
};

const STEP_TITLES: Partial<
  Record<CampaignWorkflowStepId, { nl: string; en: string; findingsNl: string; findingsEn: string }>
> = {
  business_analyzed: {
    nl: "Bedrijfsanalyse",
    en: "Business analysis",
    findingsNl: "Wat ik begrijp",
    findingsEn: "What I understand",
  },
  website_analyzed: {
    nl: "Websitecontext",
    en: "Website context",
    findingsNl: "Websitebevindingen",
    findingsEn: "Website findings",
  },
  competitors_analyzed: {
    nl: "Concurrentieanalyse",
    en: "Competitor analysis",
    findingsNl: "Concurrenten",
    findingsEn: "Competitors",
  },
  strategy_determined: {
    nl: "Strategie",
    en: "Strategy",
    findingsNl: "Strategie",
    findingsEn: "Strategy",
  },
  channels_selected: {
    nl: "Kanalen",
    en: "Channels",
    findingsNl: "Kanaalplan",
    findingsEn: "Channel plan",
  },
  deliverables_created: {
    nl: "Deliverables",
    en: "Deliverables",
    findingsNl: "Geplande deliverables",
    findingsEn: "Planned deliverables",
  },
  optimizing: {
    nl: "Optimalisatie",
    en: "Optimization",
    findingsNl: "Aanbevelingen",
    findingsEn: "Recommendations",
  },
};

function isNl(locale?: string | null): boolean {
  return locale === "nl";
}

function emmaMissingIntro(
  assembly: ContextAssemblyResult,
  nl: boolean,
  stepId: CampaignWorkflowStepId,
  campaignContext?: ReturnType<typeof buildCampaignContext>
): string {
  if (stepId === "website_analyzed") {
    if (campaignContext?.websiteUrl && campaignContext.websiteState !== "skipped") {
      return nl
        ? `De URL is opgeslagen (${campaignContext.websiteUrl}). Een volledige websiteanalyse is nog niet beschikbaar.`
        : `The URL is saved (${campaignContext.websiteUrl}). A full website analysis is not available yet.`;
    }
    return nl
      ? "Voeg een website toe of sla deze stap over om verder te gaan."
      : "Add a website or skip this step to continue.";
  }
  if (assembly.missingInformation.length > 0) {
    return formatMissingInformationMessage(assembly.missingInformation, nl);
  }
  return nl
    ? "Dat weet ik nog niet — er is nog niet genoeg bevestigde bedrijfsinformatie."
    : "I don't know yet — there isn't enough confirmed company information.";
}

function businessAnalysisNeedsInput(
  stepId: CampaignWorkflowStepId,
  assembly: ContextAssemblyResult
): boolean {
  if (stepId !== "business_analyzed") return false;
  if (assembly.state === "needs_information" || assembly.state === "unknown") return true;
  return assembly.missingInformation.some(
    (item) => item.priority === "critical" || item.priority === "high"
  );
}

function needsInfoEvidence(
  nl: boolean,
  message: string,
  title?: { nl: string; en: string }
): EvidenceBundle {
  return {
    title: nl ? (title?.nl ?? "Analyse") : (title?.en ?? "Analysis"),
    intro: message,
    sections: [
      {
        id: "needs-info",
        title: nl ? "Nog nodig" : "Still needed",
        items: [message],
      },
    ],
  };
}

function buildUrlOnlyWebsiteEvidence(
  campaignContext: ReturnType<typeof buildCampaignContext>,
  nl: boolean,
  titles?: { nl: string; en: string },
  output?: BrainRunResult["output"]
): EvidenceBundle {
  const url = campaignContext.websiteUrl ?? "—";
  const intro = nl
    ? `De URL is opgeslagen. Een volledige websiteanalyse is nog niet beschikbaar.`
    : `The URL is saved. A full website analysis is not available yet.`;

  const findingItems =
    output?.findings.map((f) => f.value).filter(Boolean) ??
    [nl ? `Opgegeven URL: ${url}` : `Supplied URL: ${url}`];

  return {
    title: nl ? (titles?.nl ?? "Websitecontext") : (titles?.en ?? "Website context"),
    intro,
    sections: [
      {
        id: "source",
        title: nl ? "Wat is opgeslagen" : "What is stored",
        items: findingItems,
      },
      {
        id: "analysis-limit",
        title: nl ? "Analyse" : "Analysis",
        items: [
          nl
            ? "Geen websitecrawl uitgevoerd — er zijn nog geen paginabeoordelingen beschikbaar."
            : "No website crawl performed — no page-level findings are available yet.",
        ],
      },
    ],
  };
}

function emmaStepIntro(
  stepId: CampaignWorkflowStepId,
  nl: boolean,
  assembly: ContextAssemblyResult,
  run: BrainRunResult["run"],
  campaignContext?: ReturnType<typeof buildCampaignContext>
): string | undefined {
  const introByStep: Partial<Record<CampaignWorkflowStepId, { nl: string; en: string }>> = {
    business_analyzed: {
      nl: "Ik begrijp je bedrijf op basis van bevestigde en bekende bronnen.",
      en: "I understand your business based on confirmed and known sources.",
    },
    website_analyzed: {
      nl: (() => {
        const url =
          campaignContext?.websiteUrl ?? assembly.companySnapshot.website?.source.url;
        return url
          ? `Website toegevoegd: ${url}. De URL is opgeslagen als context.`
          : "Websitecontext verwerkt.";
      })(),
      en: (() => {
        const url =
          campaignContext?.websiteUrl ?? assembly.companySnapshot.website?.source.url;
        return url
          ? `Website added: ${url}. The URL is saved as context.`
          : "Website context processed.";
      })(),
    },
    competitors_analyzed: {
      nl: "Ik heb je concurrenten vergeleken met je campagnedoel — op basis van wat jij hebt aangeleverd.",
      en: "I compared your competitors against your campaign goal — based on what you provided.",
    },
    strategy_determined: {
      nl: "Dit is mijn strategievoorstel op basis van je campagne-input en beschikbare context.",
      en: "This is my strategy proposal based on your campaign input and available context.",
    },
    channels_selected: {
      nl: "Op basis van de strategie heb ik bepaald waar we jouw doelgroep het beste kunnen bereiken.",
      en: "Based on the strategy I determined where we can best reach your audience.",
    },
    deliverables_created: {
      nl: "Dit zijn de deliverables die ik voor deze campagne voorstel.",
      en: "These are the deliverables I propose for this campaign.",
    },
    optimizing: {
      nl: "Op basis van beschikbare prestatiedata stel ik deze optimalisaties voor.",
      en: "Based on available performance data I recommend these optimizations.",
    },
  };

  if (assembly.state === "partial" || run.status === "partial") {
    if (assembly.missingInformation.length > 0) {
      return emmaMissingIntro(assembly, nl, stepId, campaignContext);
    }
    return introByStep[stepId]?.[nl ? "nl" : "en"];
  }

  return introByStep[stepId]?.[nl ? "nl" : "en"];
}

function evidenceFromRunResult(
  input: BuildBrainStepEvidenceInput,
  workflowResult: ExecuteBrainForWorkflowStepResult
): EvidenceBundle | null {
  const nl = isNl(input.locale);
  const { assembly, output, run } = workflowResult.result;
  const capabilityOutputs = workflowResult.resolvedUpstreamOutputs;
  const titles = STEP_TITLES[input.stepId];
  const campaignContext = buildCampaignContext({
    project: input.project,
    domainInput: input.domainInput,
    locale: input.locale,
  });

  if (
    run.status === "waiting_for_input" ||
    run.status === "blocked" ||
    (assembly.state === "unknown" && input.stepId !== "website_analyzed") ||
    businessAnalysisNeedsInput(input.stepId, assembly)
  ) {
    return needsInfoEvidence(
      nl,
      emmaMissingIntro(assembly, nl, input.stepId, campaignContext),
      titles
    );
  }

  if (!output) {
    if (assembly.state === "needs_information" || run.status === "partial") {
      if (
        input.stepId === "website_analyzed" &&
        campaignContext.websiteUrl &&
        campaignContext.websiteState !== "skipped"
      ) {
        return buildUrlOnlyWebsiteEvidence(campaignContext, nl, titles);
      }
      return needsInfoEvidence(
        nl,
        emmaMissingIntro(assembly, nl, input.stepId, campaignContext),
        titles
      );
    }
    return null;
  }

  if (
    output.warnings.some((w) => w.code === "website_unavailable") &&
    input.stepId === "website_analyzed"
  ) {
    if (campaignContext.websiteUrl && campaignContext.websiteState !== "skipped") {
      return buildUrlOnlyWebsiteEvidence(campaignContext, nl, titles);
    }
    return needsInfoEvidence(
      nl,
      emmaMissingIntro(assembly, nl, input.stepId, campaignContext),
      titles
    );
  }

  if (
    output.warnings.some((w) => w.code === "website_url_only") &&
    input.stepId === "website_analyzed"
  ) {
    return buildUrlOnlyWebsiteEvidence(campaignContext, nl, titles, output);
  }

  const bundle = presentBrainOutputForCampaign({
    title: nl ? (titles?.nl ?? "Analyse") : (titles?.en ?? "Analysis"),
    intro: emmaStepIntro(input.stepId, nl, assembly, run, campaignContext),
    output,
    locale: nl ? "nl" : "en",
    findingsSectionTitle: nl ? titles?.findingsNl : titles?.findingsEn,
    recommendationsSectionTitle: nl ? "Aanbevelingen" : "Recommendations",
    campaignContext: {
      usesExternalBrand: campaignContext.usesExternalBrand,
      accountOrganizationName: campaignContext.accountOrganizationName,
    },
  });

  return {
    ...bundle,
    capabilityOutputs,
    devDiagnostics: isBrainDevDiagnosticsEnabled()
      ? extractBrainDevDiagnostics(workflowResult.result)
      : undefined,
  };
}

/** Maps Brain capability output → campaign workflow evidence bundle via Runtime (sync). */
export function buildBrainStepEvidence(input: BuildBrainStepEvidenceInput): EvidenceBundle | null {
  if (!primaryCapabilityForWorkflowStep(input.stepId)) return null;
  const result = executeBrainForWorkflowStepSync(input);
  if (!result) return null;
  return evidenceFromRunResult(input, result);
}

/** Async path — live Office uses BrainRuntime.executeRun with real lifecycle progress. */
export async function buildBrainStepEvidenceAsync(
  input: BuildBrainStepEvidenceInput,
  options?: ExecuteBrainForWorkflowStepOptions
): Promise<EvidenceBundle | null> {
  if (!primaryCapabilityForWorkflowStep(input.stepId)) return null;
  const result = await executeBrainForWorkflowStep(input, options);
  if (!result) return null;
  return evidenceFromRunResult(input, result);
}
