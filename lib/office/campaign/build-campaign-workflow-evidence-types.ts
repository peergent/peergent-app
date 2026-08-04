import type { BrainDevDiagnostics } from "@/lib/brain/integration/brain-dev-diagnostics";
import type { CampaignEvidenceSection } from "@/lib/office/campaign/workflow-types";

export type EvidenceBundle = {
  title: string;
  intro?: string;
  sections: readonly CampaignEvidenceSection[];
  /** Structured Brain outputs resolved for this evidence step (dev/session reuse). */
  capabilityOutputs?: Partial<
    Record<
      import("@/lib/brain/capabilities/registry").BrainCapabilityId,
      import("@/lib/brain/evidence/structured-output").BrainStructuredOutput
    >
  >;
  /** Development-only — never shown to production customers. */
  devDiagnostics?: BrainDevDiagnostics;
};
