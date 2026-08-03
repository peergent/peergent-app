import type { CampaignEvidenceSection } from "@/lib/office/campaign/workflow-types";

export type EvidenceBundle = {
  title: string;
  intro?: string;
  sections: readonly CampaignEvidenceSection[];
};
