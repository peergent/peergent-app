/**
 * PX-58 — structured diagnostics for Office → durable approval bridge (no customer content).
 */

export type ApprovalBridgeDiagnosticEvent =
  | "approval_submission_requested"
  | "approval_bridge_resolved"
  | "approval_persistence_started"
  | "approval_persistence_completed"
  | "approval_persistence_failed"
  | "approval_checkpoint_resolution_started"
  | "approval_checkpoint_resolution_failed"
  | "approval_checkpoint_resolved"
  | "approval_already_satisfied"
  | "post_approval_resume_requested"
  | "post_approval_resume_started"
  | "post_approval_resume_failed"
  | "post_approval_resume_completed"
  | "approved_package_handoff_resolved";

export type ApprovalBridgeDiagnosticPayload = {
  event: ApprovalBridgeDiagnosticEvent;
  organizationId: string;
  projectId: string;
  episodeId?: string;
  episodeVersion?: number;
  checkpointKind?: string;
  bridgeStepId?: string;
  decision?: string;
  errorCode?: string;
  errorClass?: string;
  durationMs?: number;
  packageId?: string;
  packageVersion?: string;
  snapshotState?: string;
  episodeStatus?: string;
  durableVersion?: number;
  stopReason?: string;
};

export function safeApprovalBridgeError(error: unknown): {
  errorCode: string;
  errorClass: string;
} {
  if (error instanceof Error) {
    const code =
      "code" in error && typeof (error as { code?: unknown }).code === "string"
        ? (error as { code: string }).code
        : error.message.slice(0, 80);
    return { errorCode: code, errorClass: error.name };
  }
  return { errorCode: String(error).slice(0, 80), errorClass: "UnknownError" };
}

export function emitApprovalBridgeDiagnostic(payload: ApprovalBridgeDiagnosticPayload): void {
  if (process.env.BRAIN_PERSISTENCE_DIAGNOSTICS === "0") return;
  const line = JSON.stringify({
    ts: new Date().toISOString(),
    domain: "approval_bridge",
    ...payload,
  });
  if (process.env.NODE_ENV === "test") return;
  console.info(line);
}
