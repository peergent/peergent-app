import type { ContextAssemblySource } from "./assembly-types";
import type { CustomerCorrection } from "../company/corrections";

export type ContextAssemblyAuditEntry = {
  source: ContextAssemblySource;
  refId: string;
  action: "used" | "ignored" | "corrected";
  label?: string;
};

/** Assembly trace — no chain of thought. */
export type ContextAssemblyAuditTrace = {
  traceId: string;
  organizationId: string;
  sourcesUsed: readonly ContextAssemblyAuditEntry[];
  sourcesIgnored: readonly ContextAssemblyAuditEntry[];
  unknowns: readonly string[];
  correctionsApplied: readonly CustomerCorrection[];
  warnings: readonly string[];
  assembledAt: string;
};

export function createAssemblyAuditTrace(input: {
  organizationId: string;
  traceId?: string;
  assembledAt: string;
}): ContextAssemblyAuditTrace {
  return {
    traceId: input.traceId ?? `asm-${input.organizationId}-${Date.now()}`,
    organizationId: input.organizationId,
    sourcesUsed: [],
    sourcesIgnored: [],
    unknowns: [],
    correctionsApplied: [],
    warnings: [],
    assembledAt: input.assembledAt,
  };
}
