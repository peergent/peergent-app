import type {
  ExecutionContext,
  ExecutionInstruction,
  ExecutionPayload,
  ExecutionProviderCapabilities,
  ExecutionProviderId,
  ExecutionReceipt,
  ExecutionResult,
  ExecutionTarget,
  ProviderHealthStatus,
} from "./types";

export type ProviderAdapterContext = ExecutionContext & {
  readonly health: ProviderHealthStatus;
  readonly configRef: string | null;
};

export type ProviderValidateResult =
  | { ok: true }
  | { ok: false; reason: string; failureClass: import("./types").ExecutionFailureClass };

export type ProviderLookupResult = {
  readonly found: boolean;
  readonly receipt: ExecutionReceipt | null;
};

export type ProviderRollbackResult = {
  readonly supported: boolean;
  readonly rolledBack: boolean;
  readonly receipt: ExecutionReceipt | null;
  readonly reason: string;
};

/** Provider adapter contract — zero provider logic in Execution Layer core. */
export type ExecutionProviderAdapter = {
  readonly providerId: ExecutionProviderId;
  readonly capabilities: ExecutionProviderCapabilities;
  supports(instruction: Pick<ExecutionInstruction, "target" | "publicationMode">): boolean;
  validate(
    instruction: ExecutionInstruction,
    ctx: ProviderAdapterContext
  ): ProviderValidateResult;
  execute(
    instruction: ExecutionInstruction,
    ctx: ProviderAdapterContext
  ): Promise<ExecutionResult>;
  lookup(
    externalId: string,
    ctx: ProviderAdapterContext
  ): Promise<ProviderLookupResult>;
  cancel(
    externalId: string,
    ctx: ProviderAdapterContext
  ): Promise<{ cancelled: boolean; reason: string }>;
  rollback(
    receipt: ExecutionReceipt,
    ctx: ProviderAdapterContext
  ): Promise<ProviderRollbackResult>;
};

export type BuildStubReceiptInput = {
  instruction: ExecutionInstruction;
  ctx: ProviderAdapterContext;
  dryRun: boolean;
  providerStatus?: string;
};

export function buildStubProviderReceipt(input: BuildStubReceiptInput): ExecutionReceipt {
  const ts = new Date().toISOString();
  return {
    id: `rcpt-${input.instruction.executionId}-${input.instruction.target.provider}`,
    executionId: input.instruction.executionId,
    provider: input.instruction.target.provider,
    externalId: `ext-${input.instruction.target.provider}-${input.instruction.deliverable.id}`,
    externalUrl: input.dryRun
      ? null
      : `https://provider.example/${input.instruction.target.provider}/${input.instruction.deliverable.id}`,
    providerTimestamp: ts,
    providerStatus: input.providerStatus ?? (input.dryRun ? "dry_run_simulated" : "published"),
    dryRun: input.dryRun,
    evidenceSummary: input.dryRun
      ? "Dry run — no external side effects."
      : `Provider ${input.instruction.target.provider} confirmed publication.`,
  };
}

export function channelToProvider(channel: string): ExecutionProviderId {
  const normalized = channel.toLowerCase();
  if (normalized.includes("linkedin")) return "linkedin";
  if (normalized.includes("meta") || normalized.includes("facebook") || normalized.includes("instagram")) {
    return "meta";
  }
  if (normalized.includes("google")) return "google_ads";
  if (normalized.includes("email") || normalized.includes("mail")) return "email";
  if (normalized.includes("blog") || normalized.includes("cms") || normalized.includes("wordpress")) return "cms";
  if (normalized.includes("crm")) return "crm";
  if (normalized.includes("calendar")) return "calendar";
  return "stub";
}

export function buildPayloadFromDeliverable(
  deliverable: import("../creative/types").CreativeDeliverable
): ExecutionPayload {
  return {
    deliverableId: deliverable.id,
    channel: deliverable.channel,
    headline: deliverable.headline,
    hook: deliverable.hook,
    bodyOutline: deliverable.bodyOutline,
    cta: deliverable.cta,
    payloadRef: `payload:${deliverable.id}`,
    mediaRefs: [],
  };
}

export function defaultDestination(provider: ExecutionProviderId, channel: string): string {
  return `${provider}:${channel}`;
}
