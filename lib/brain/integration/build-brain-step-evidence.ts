import type { EvidenceBundle } from "@/lib/office/campaign/build-campaign-workflow-evidence-types";
import type { CampaignWorkflowStepId } from "@/lib/office/campaign/workflow-types";
import type { MarketingPeerDomainInput } from "@/lib/peer-experience/marketing/view-models/marketing-peer-domain-input";
import type { MarketingProject } from "@/lib/peer-experience/marketing/projects/types";
import { resolveCompanyIntelligence } from "../integration/resolve-company-intelligence";
import { executeCompanyUnderstanding } from "../capabilities/company-understanding";
import { executeWebsiteUnderstanding } from "../capabilities/website-understanding";
import { presentBrainOutputForCampaign } from "../presentation/campaign-evidence-adapter";

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

/** Maps Brain capability output → campaign workflow evidence bundle. */
export function buildBrainStepEvidence(input: BuildBrainStepEvidenceInput): EvidenceBundle | null {
  const nl = isNl(input.locale);
  const { snapshot, readiness } = resolveCompanyIntelligence({
    peerId: input.peerId,
    project: input.project,
    domainInput: input.domainInput,
  });

  switch (input.stepId) {
    case "business_analyzed": {
      if (readiness === "unknown") {
        return {
          title: nl ? "Bedrijfsanalyse" : "Business analysis",
          intro: nl
            ? "Dat weet ik nog niet — er is nog niet genoeg bevestigde bedrijfsinformatie."
            : "I don't know yet — there isn't enough confirmed company information.",
          sections: [
            {
              id: "unknown",
              title: nl ? "Status" : "Status",
              items: [
                nl
                  ? "Voeg bedrijfscontext toe of bevestig je profiel."
                  : "Add company context or confirm your profile.",
              ],
            },
          ],
        };
      }

      const output = executeCompanyUnderstanding({
        companySnapshot: snapshot,
        locale: nl ? "nl" : "en",
      });
      const presentation = presentBrainOutputForCampaign({
        title: nl ? "Bedrijfsanalyse" : "Business analysis",
        intro: nl
          ? "Ik begrijp je bedrijf op basis van bevestigde en bekende bronnen."
          : "I understand your business based on confirmed and known sources.",
        output,
        findingsSectionTitle: nl ? "Wat ik begrijp" : "What I understand",
      });
      return presentation;
    }

    case "website_analyzed": {
      const output = executeWebsiteUnderstanding({
        companySnapshot: snapshot,
        locale: nl ? "nl" : "en",
      });
      if (output.warnings.some((w) => w.code === "website_unavailable")) {
        return null;
      }
      const url = snapshot.website?.source.url ?? "—";
      const presentation = presentBrainOutputForCampaign({
        title: nl ? "Websitecontext" : "Website context",
        intro: nl
          ? `Website-snapshot voor ${url} (simulatie — geen echte websitecrawl).`
          : `Website snapshot for ${url} (simulated — no real website crawl).`,
        output,
        findingsSectionTitle: nl ? "Websitebevindingen" : "Website findings",
        recommendationsSectionTitle: nl ? "Aanbevelingen" : "Recommendations",
      });
      return presentation;
    }

    default:
      return null;
  }
}
