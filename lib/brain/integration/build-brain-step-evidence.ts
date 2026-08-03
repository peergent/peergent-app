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
} from "./execute-brain-for-workflow-step";

export type BuildBrainStepEvidenceInput = {
  stepId: CampaignWorkflowStepId;
  peerId: string;
  project: MarketingProject;
  domainInput: MarketingPeerDomainInput;
  locale?: string | null;
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
    title: nl ? (title?.nl ?? "Bedrijfsanalyse") : (title?.en ?? "Business analysis"),
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
  const missingMsg = formatMissingInformationMessage(assembly.missingInformation, nl);

  if (
    run.status === "waiting_for_input" ||
    run.status === "blocked" ||
    assembly.state === "unknown" ||
    assembly.state === "needs_information"
  ) {
    if (input.stepId === "website_analyzed") {
      return needsInfoEvidence(
        nl,
        nl
          ? "Dat weet ik nog niet — er is nog geen website-snapshot beschikbaar."
          : "I don't know yet — no website snapshot is available.",
        { nl: "Websitecontext", en: "Website context" }
      );
    }
    return needsInfoEvidence(
      nl,
      assembly.state === "unknown"
        ? nl
          ? "Dat weet ik nog niet — er is nog niet genoeg bevestigde bedrijfsinformatie."
          : "I don't know yet — there isn't enough confirmed company information."
        : missingMsg
    );
  }

  if (!output) return null;

  switch (input.stepId) {
    case "business_analyzed": {
      const intro =
        assembly.state === "partial" || run.status === "partial"
          ? missingMsg
          : nl
            ? "Ik begrijp je bedrijf op basis van bevestigde en bekende bronnen."
            : "I understand your business based on confirmed and known sources.";
      return presentBrainOutputForCampaign({
        title: nl ? "Bedrijfsanalyse" : "Business analysis",
        intro,
        output,
        findingsSectionTitle: nl ? "Wat ik begrijp" : "What I understand",
      });
    }

    case "website_analyzed": {
      if (output.warnings.some((w) => w.code === "website_unavailable")) {
        return needsInfoEvidence(
          nl,
          nl
            ? "Dat weet ik nog niet — er is nog geen website-snapshot beschikbaar."
            : "I don't know yet — no website snapshot is available.",
          { nl: "Websitecontext", en: "Website context" }
        );
      }
      const url = assembly.companySnapshot.website?.source.url ?? "—";
      return presentBrainOutputForCampaign({
        title: nl ? "Websitecontext" : "Website context",
        intro: nl
          ? `Website-snapshot voor ${url} (simulatie — geen echte websitecrawl).`
          : `Website snapshot for ${url} (simulated — no real website crawl).`,
        output,
        findingsSectionTitle: nl ? "Websitebevindingen" : "Website findings",
        recommendationsSectionTitle: nl ? "Aanbevelingen" : "Recommendations",
      });
    }

    default:
      return null;
  }
}

/** Maps Brain capability output → campaign workflow evidence bundle via Runtime. */
export function buildBrainStepEvidence(input: BuildBrainStepEvidenceInput): EvidenceBundle | null {
  const result = executeBrainForWorkflowStepSync(input);
  if (!result) return null;
  return evidenceFromRunResult(input, result);
}

/** Async path — runs website provider when URL added via dialog. */
export async function buildBrainStepEvidenceAsync(
  input: BuildBrainStepEvidenceInput
): Promise<EvidenceBundle | null> {
  const result = await executeBrainForWorkflowStep(input);
  if (!result) return null;
  return evidenceFromRunResult(input, result);
}
