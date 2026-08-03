import type { BrainRunStatus } from "./run-lifecycle";
import type { BrainRunRecord } from "./repositories/contracts";
import type { BrainStructuredOutput } from "../evidence/structured-output";
import type { ContextAssemblyResult } from "../context/assembly-types";
import type { BrainPolicyResult } from "../policy/approval-policy";
import type { CampaignEvidencePresentation } from "../presentation/campaign-evidence-adapter";

export type BrainRunResult = {
  run: BrainRunRecord;
  assembly: ContextAssemblyResult;
  output: BrainStructuredOutput | null;
  policy: BrainPolicyResult;
  presentation: CampaignEvidencePresentation | null;
  cacheHit: boolean;
};

export type BrainRunSubmitResult = {
  runId: string;
  status: BrainRunStatus;
  idempotentReplay: boolean;
};
