type BrainLogLevel = "info" | "warn" | "error";

export type BrainOperationalLog = {
  level: BrainLogLevel;
  event: string;
  runId?: string;
  correlationId?: string;
  organizationRef?: string;
  capability?: string;
  transition?: string;
  durationMs?: number;
  repositoryOutcome?: "ok" | "error";
  retryCount?: number;
  errorClassification?: string;
};

function privacySafeOrgRef(organizationId: string): string {
  return organizationId.length > 8 ? `${organizationId.slice(0, 8)}…` : organizationId;
}

export function logBrainOperation(input: BrainOperationalLog): void {
  const payload = {
    ...input,
    organizationRef: input.organizationRef
      ? privacySafeOrgRef(input.organizationRef)
      : undefined,
  };
  if (input.level === "error") {
    console.error("[brain]", payload);
    return;
  }
  if (input.level === "warn") {
    console.warn("[brain]", payload);
    return;
  }
  console.info("[brain]", payload);
}
