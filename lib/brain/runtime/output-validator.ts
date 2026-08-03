import type { BrainStructuredOutput } from "../evidence/structured-output";
import { BrainOutputValidationError } from "./errors";

function hasProvenance(item: { provenance: readonly unknown[] }): boolean {
  return item.provenance.length > 0;
}

/** Validates structured output before customer presentation. */
export function validateBrainStructuredOutput(output: BrainStructuredOutput): readonly string[] {
  const issues: string[] = [];

  if (output.capabilityId.trim() === "") issues.push("Missing capabilityId");
  if (output.capabilityVersion.trim() === "") issues.push("Missing capabilityVersion");
  if (!output.generatedAt) issues.push("Missing generatedAt");

  for (const finding of output.findings) {
    if (!finding.label.trim()) issues.push(`Finding ${finding.id} missing label`);
    if (!hasProvenance(finding)) issues.push(`Finding ${finding.id} missing provenance`);
  }

  for (const rec of output.recommendations) {
    if (!hasProvenance(rec)) issues.push(`Recommendation ${rec.id} missing provenance`);
  }

  for (const proposal of output.actionProposals) {
    if (!hasProvenance(proposal)) issues.push(`Action proposal ${proposal.id} missing provenance`);
  }

  for (const warning of output.warnings) {
    if (!warning.message.trim()) issues.push(`Warning ${warning.id} missing message`);
  }

  return issues;
}

export function assertValidBrainOutput(output: BrainStructuredOutput): void {
  const issues = validateBrainStructuredOutput(output);
  if (issues.length > 0) {
    throw new BrainOutputValidationError(issues);
  }
}

/** Customer-safe explanation must exist when findings are present. */
export function outputHasCustomerExplanation(output: BrainStructuredOutput): boolean {
  if (output.findings.length === 0 && output.warnings.length > 0) return true;
  if (output.findings.length === 0) return true;
  return output.findings.every((f) => f.label.trim().length > 0 && f.value.trim().length > 0);
}
