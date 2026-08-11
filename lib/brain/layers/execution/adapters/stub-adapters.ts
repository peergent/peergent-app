import type { ExecutionProviderAdapter } from "../execution-provider-adapter";
import {
  buildPayloadFromDeliverable,
  buildStubProviderReceipt,
  channelToProvider,
  defaultDestination,
} from "../execution-provider-adapter";
import type {
  ExecutionFailureClass,
  ExecutionInstruction,
  ExecutionProviderCapabilities,
  ExecutionProviderId,
  ExecutionResult,
  ExecutionStatus,
} from "../types";

const BASE_CAPABILITIES: ExecutionProviderCapabilities = {
  supportsPublishing: true,
  supportsScheduling: true,
  supportsEditing: false,
  supportsDeletion: false,
  supportsMedia: true,
  supportsVideo: false,
  supportsDrafts: true,
  supportsRollback: false,
  supportsLookup: true,
  supportsCancel: true,
};

function createStubAdapter(
  providerId: ExecutionProviderId,
  overrides: Partial<ExecutionProviderCapabilities> = {},
  simulateFailure?: ExecutionFailureClass
): ExecutionProviderAdapter {
  const capabilities: ExecutionProviderCapabilities = { ...BASE_CAPABILITIES, ...overrides };

  return {
    providerId,
    capabilities,
    supports(instruction) {
      return instruction.target.provider === providerId;
    },
    validate(instruction, ctx) {
      if (ctx.health === "unavailable" || ctx.health === "maintenance") {
        return {
          ok: false,
          reason: `Provider ${providerId} is ${ctx.health}.`,
          failureClass: "PROVIDER_UNAVAILABLE",
        };
      }
      if (ctx.health === "rate_limited") {
        return { ok: false, reason: "Rate limited.", failureClass: "RATE_LIMITED" };
      }
      if (!ctx.configRef && !ctx.dryRun) {
        return {
          ok: false,
          reason: `Provider ${providerId} configuration missing.`,
          failureClass: "AUTHENTICATION",
        };
      }
      if (instruction.publicationMode === "scheduled" && !capabilities.supportsScheduling) {
        return {
          ok: false,
          reason: `${providerId} does not support scheduling.`,
          failureClass: "VALIDATION",
        };
      }
      if (instruction.publicationMode !== "draft" && !capabilities.supportsPublishing) {
        return {
          ok: false,
          reason: `${providerId} does not support publishing.`,
          failureClass: "VALIDATION",
        };
      }
      if (!instruction.payload.headline.trim()) {
        return { ok: false, reason: "Payload headline missing.", failureClass: "VALIDATION" };
      }
      return { ok: true };
    },
    async execute(instruction, ctx) {
      const attemptNumber = (instruction.priorExecutionMetadata?.attemptCount ?? 0) + 1;
      const startedAt = new Date().toISOString();
      const attemptId = `att-${instruction.executionId}-${attemptNumber}`;

      if (simulateFailure && !ctx.dryRun) {
        const retryable =
          simulateFailure === "RETRYABLE" ||
          simulateFailure === "RATE_LIMITED" ||
          simulateFailure === "PROVIDER_UNAVAILABLE" ||
          simulateFailure === "UNKNOWN";
        const status: ExecutionStatus = retryable ? "RETRYABLE" : "FAILED";
        return {
          executionId: instruction.executionId,
          status,
          receipt: null,
          failure: {
            id: `fail-${attemptId}`,
            executionId: instruction.executionId,
            provider: providerId,
            failureClass: simulateFailure,
            message: `Simulated ${simulateFailure} failure for ${providerId}.`,
            retryable,
            at: startedAt,
          },
          attempt: {
            id: attemptId,
            executionId: instruction.executionId,
            attemptNumber,
            status,
            provider: providerId,
            startedAt,
            completedAt: startedAt,
            receipt: null,
            failure: {
              id: `fail-${attemptId}`,
              executionId: instruction.executionId,
              provider: providerId,
              failureClass: simulateFailure,
              message: `Simulated ${simulateFailure} failure.`,
              retryable,
              at: startedAt,
            },
            idempotencyKey: instruction.idempotencyKey,
            correlationId: instruction.correlationId,
          },
        };
      }

      const receipt = buildStubProviderReceipt({
        instruction,
        ctx,
        dryRun: ctx.dryRun,
      });

      return {
        executionId: instruction.executionId,
        status: "SUCCEEDED",
        receipt,
        failure: null,
        attempt: {
          id: attemptId,
          executionId: instruction.executionId,
          attemptNumber,
          status: "SUCCEEDED",
          provider: providerId,
          startedAt,
          completedAt: new Date().toISOString(),
          receipt,
          failure: null,
          idempotencyKey: instruction.idempotencyKey,
          correlationId: instruction.correlationId,
        },
      };
    },
    async lookup(externalId, ctx) {
      if (ctx.dryRun) return { found: false, receipt: null };
      return {
        found: true,
        receipt: {
          id: `rcpt-lookup-${externalId}`,
          executionId: externalId,
          provider: providerId,
          externalId,
          externalUrl: `https://provider.example/${providerId}/${externalId}`,
          providerTimestamp: new Date().toISOString(),
          providerStatus: "published",
          dryRun: false,
          evidenceSummary: "Lookup confirmed provider state.",
        },
      };
    },
    async cancel(_externalId, _ctx) {
      return { cancelled: capabilities.supportsCancel, reason: "Cancel requested." };
    },
    async rollback(receipt, ctx) {
      if (!capabilities.supportsRollback) {
        return { supported: false, rolledBack: false, receipt: null, reason: "Rollback not supported." };
      }
      return {
        supported: true,
        rolledBack: !ctx.dryRun,
        receipt: ctx.dryRun ? null : { ...receipt, providerStatus: "rolled_back" },
        reason: "Rollback completed.",
      };
    },
  };
}

export const linkedInStubAdapter = createStubAdapter("linkedin");
export const metaStubAdapter = createStubAdapter("meta");
export const googleAdsStubAdapter = createStubAdapter("google_ads", {}, "RETRYABLE");
export const emailStubAdapter = createStubAdapter("email", {
  supportsMedia: false,
  supportsVideo: false,
});
export const cmsStubAdapter = createStubAdapter("cms", {
  supportsScheduling: false,
});
export const crmStubAdapter = createStubAdapter("crm", {
  supportsPublishing: false,
  supportsDrafts: false,
});
export const calendarStubAdapter = createStubAdapter("calendar", {
  supportsPublishing: false,
});
export const genericStubAdapter = createStubAdapter("stub");

export function buildInstructionFromDeliverable(input: {
  deliverable: import("../../creative/types").CreativeDeliverable;
  validationRef: string;
  approvalRef: string | null;
  approvalState: import("../types").ExecutionApprovalState;
  validationState: import("../types").ExecutionValidationState;
  context: import("../types").ExecutionBrainInput;
  executionId: string;
  provider?: ExecutionProviderId;
}): ExecutionInstruction {
  const provider = input.provider ?? channelToProvider(input.deliverable.channel);
  return {
    executionId: input.executionId,
    idempotencyKey: `${input.context.idempotencyKey}:${input.deliverable.id}`,
    correlationId: input.context.correlationId ?? `corr-${input.context.projectId}`,
    projectId: input.context.projectId,
    organizationId: input.context.organizationId,
    peerId: input.context.peerId,
    campaignId: input.context.projectId,
    deliverable: input.deliverable,
    target: {
      provider,
      destination: defaultDestination(provider, input.deliverable.channel),
      channel: input.deliverable.channel,
      deliverableId: input.deliverable.id,
    },
    payload: buildPayloadFromDeliverable(input.deliverable),
    publicationMode: input.context.publicationMode ?? "immediate",
    scheduleRef: input.context.scheduleRef ?? null,
    approvalState: input.approvalState,
    validationState: input.validationState,
    validationRef: input.validationRef,
    approvalRef: input.approvalRef ?? null,
    priorExecutionMetadata: null,
    createdAt: new Date().toISOString(),
  };
}
