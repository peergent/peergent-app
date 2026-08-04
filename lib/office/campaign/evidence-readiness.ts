import type { CampaignEvidenceSection } from "./workflow-types";
import type { CampaignContext } from "./campaign-context";

export type EvidenceMissingAction =
  | "add_website"
  | "add_company"
  | "add_context"
  | "later";

export type EvidenceMissingCta = {
  label: string;
  action: EvidenceMissingAction;
  primary?: boolean;
};

export function evidenceBlocksWorkflowAdvance(sections: readonly CampaignEvidenceSection[]): boolean {
  return sections.some((section) => section.id === "needs-info");
}

export function buildEvidenceMissingCtas(input: {
  sections: readonly CampaignEvidenceSection[];
  campaignContext: CampaignContext;
  locale?: string | null;
}): EvidenceMissingCta[] {
  const nl = input.locale === "nl";
  const needsInfo = input.sections.some((section) => section.id === "needs-info");

  const needsWebsite =
    needsInfo &&
    input.campaignContext.websiteState !== "skipped" &&
    input.campaignContext.websiteState === "missing" &&
    input.sections.some((s) => s.items.some((item) => /website/i.test(item)));

  const needsCompany =
    needsInfo &&
    input.sections.some((s) =>
      s.items.some((item) =>
        /bedrijf|company|branche|industry|doelgroep|audience|missie|mission|unieke|selling|positionering|positioning|tone|bedrijfsinformatie|company information/i.test(
          item
        )
      )
    );

  const ctas: EvidenceMissingCta[] = [];

  if (needsWebsite) {
    ctas.push({
      label: nl ? "Website toevoegen" : "Add website",
      action: "add_website",
      primary: true,
    });
  } else if (needsCompany || needsInfo) {
    ctas.push({
      label: nl ? "Campagnecontext aanvullen" : "Complete campaign context",
      action: "add_context",
      primary: true,
    });
  } else {
    ctas.push({
      label: nl ? "Context aanvullen" : "Add context",
      action: "add_context",
      primary: true,
    });
  }

  ctas.push({
    label: nl ? "Later aanvullen" : "Complete later",
    action: "later",
  });

  return ctas;
}
