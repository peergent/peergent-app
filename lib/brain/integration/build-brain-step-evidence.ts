import type { EvidenceBundle } from "@/lib/office/campaign/build-campaign-workflow-evidence-types";
import type { CampaignWorkflowStepId } from "@/lib/office/campaign/workflow-types";
import type { MarketingPeerDomainInput } from "@/lib/peer-experience/marketing/view-models/marketing-peer-domain-input";
import type { MarketingProject } from "@/lib/peer-experience/marketing/projects/types";
import { formatMissingInformationMessage } from "../context/company-context-assembler";
import { presentBrainOutputForCampaign } from "../presentation/campaign-evidence-adapter";
import type { BrainRunResult } from "../runtime/run-result";
import {
  executeBrainForWorkflowStep,
  executeBrainForWorkflowStepSync,
  primaryCapabilityForWorkflowStep,
} from "./execute-brain-for-workflow-step";

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

function needsInfoEvidence(
  nl: boolean,
  missingMessage: string,
  title?: { nl: string; en: string }
): EvidenceBundle {
  return {
    title: nl ? (title?.nl ?? "Analyse") : (title?.en ?? "Analysis"),
    intro: missingMessage,
    sections: [
      {
        id: "needs-info",
        title: nl ? "Nog nodig" : "Still needed",
        items: [missingMessage],
      },
    ],
  };
}

function evidenceFromRunResult(
  input: BuildBrainStepEvidenceInput,
  result: BrainRunResult
): EvidenceBundle | null {
  const nl = isNl(input.locale);
  const { assembly, output, run } = result;
  const titles = STEP_TITLES[input.stepId];
  const missingMsg = formatMissingInformationMessage(assembly.missingInformation, nl);

  if (
    run.status === "waiting_for_input" ||
    run.status === "blocked" ||
    assembly.state === "unknown"
  ) {
    if (input.stepId === "website_analyzed") {
      return needsInfoEvidence(
        nl,
        nl
          ? "Dat weet ik nog niet — er is nog geen website-snapshot beschikbaar."
          : "I don't know yet — no website snapshot is available.",
        titles
      );
    }
    return needsInfoEvidence(
      nl,
      assembly.state === "unknown"
        ? nl
          ? "Dat weet ik nog niet — er is nog niet genoeg bevestigde bedrijfsinformatie."
          : "I don't know yet — there isn't enough confirmed company information."
        : missingMsg,
      titles
    );
  }

  if (!output) {
    if (assembly.state === "needs_information" || run.status === "partial") {
      return needsInfoEvidence(nl, missingMsg, titles);
    }
    return null;
  }

  if (output.warnings.some((w) => w.code === "website_unavailable") && input.stepId === "website_analyzed") {
    return needsInfoEvidence(
      nl,
      nl
        ? "Dat weet ik nog niet — er is nog geen website-snapshot beschikbaar."
        : "I don't know yet — no website snapshot is available.",
      titles
    );
  }

  const introByStep: Partial<Record<CampaignWorkflowStepId, { nl: string; en: string }>> = {
    business_analyzed: {
      nl: "Ik begrijp je bedrijf op basis van bevestigde en bekende bronnen.",
      en: "I understand your business based on confirmed and known sources.",
    },
    website_analyzed: {
      nl: `Website-snapshot voor ${assembly.companySnapshot.website?.source.url ?? "—"} (simulatie — geen echte websitecrawl).`,
      en: `Website snapshot for ${assembly.companySnapshot.website?.source.url ?? "—"} (simulated — no real website crawl).`,
    },
    competitors_analyzed: {
      nl: "Concurrenten komen alleen uit jouw input — geen marktonderzoek.",
      en: "Competitors come only from your input — no market research.",
    },
    strategy_determined: {
      nl: "Strategie op basis van campagne-input en beschikbare context.",
      en: "Strategy based on campaign input and available context.",
    },
    channels_selected: {
      nl: "Kanaalplan gekoppeld aan de strategie.",
      en: "Channel plan linked to strategy.",
    },
    deliverables_created: {
      nl: "Geplande deliverables — nog geen definitieve content.",
      en: "Planned deliverables — no final content yet.",
    },
    optimizing: {
      nl: "Optimalisatie-aanbevelingen op basis van beschikbare prestatiedata.",
      en: "Optimization recommendations based on available performance data.",
    },
  };

  const intro =
    input.stepId === "website_analyzed"
      ? introByStep.website_analyzed?.[nl ? "nl" : "en"]
      : assembly.state === "partial" || run.status === "partial"
        ? missingMsg
        : introByStep[input.stepId]?.[nl ? "nl" : "en"];

  return presentBrainOutputForCampaign({
    title: nl ? (titles?.nl ?? "Analyse") : (titles?.en ?? "Analysis"),
    intro,
    output,
    locale: nl ? "nl" : "en",
    findingsSectionTitle: nl ? titles?.findingsNl : titles?.findingsEn,
    recommendationsSectionTitle: nl ? "Aanbevelingen" : "Recommendations",
  });
}

/** Maps Brain capability output → campaign workflow evidence bundle via Runtime. */
export function buildBrainStepEvidence(input: BuildBrainStepEvidenceInput): EvidenceBundle | null {
  if (!primaryCapabilityForWorkflowStep(input.stepId)) return null;
  const result = executeBrainForWorkflowStepSync(input);
  if (!result) return null;
  return evidenceFromRunResult(input, result);
}

/** Async path — runs website provider when URL added via dialog. */
export async function buildBrainStepEvidenceAsync(
  input: BuildBrainStepEvidenceInput
): Promise<EvidenceBundle | null> {
  if (!primaryCapabilityForWorkflowStep(input.stepId)) return null;
  const result = await executeBrainForWorkflowStep(input);
  if (!result) return null;
  return evidenceFromRunResult(input, result);
}
