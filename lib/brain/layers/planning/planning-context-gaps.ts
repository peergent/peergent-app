import type { ExecutionPreparation, PlannedDeliverable } from "./brain-types";
import type { StrategyPlanningContext } from "./brain-types";

export function buildExecutionPreparations(input: {
  ctx: StrategyPlanningContext;
  deliverables: readonly PlannedDeliverable[];
  scheduleWindow: string | null;
}): ExecutionPreparation[] {
  return input.deliverables
    .filter((d) => d.executionRequired)
    .map((d) => ({
      id: `exec-prep-${d.id}`,
      deliverableId: d.id,
      targetChannel: d.channel,
      requiredProvider: inferProvider(d.channel),
      requiredIntegration: inferIntegration(d.channel),
      requiredAccount: inferAccount(d.channel),
      requiredApproval: d.approvalRequired,
      requiredValidation: d.validationRequired,
      scheduleWindow: input.scheduleWindow,
      payloadRequirements: [`${d.type} assets`, "Tracking parameters"],
      trackingRequirements: input.ctx.funnelStrategy.measurementPoints.slice(0, 3),
    }));
}

function inferProvider(channel: string): string | null {
  const lower = channel.toLowerCase();
  if (lower.includes("google")) return "google_ads";
  if (lower.includes("linkedin")) return "linkedin_ads";
  if (lower.includes("meta") || lower.includes("facebook")) return "meta_ads";
  return null;
}

function inferIntegration(channel: string): string | null {
  const provider = inferProvider(channel);
  return provider ? `${provider}_integration` : null;
}

function inferAccount(channel: string): string | null {
  return inferProvider(channel) ? `${inferProvider(channel)}_account` : null;
}

export const MEMORY_CHECKPOINT_RECOMMENDATIONS = [
  "after strategy approval",
  "after creative validation",
  "after customer approval",
  "after execution",
] as const;

export function buildBudgetOperationalLabels(input: {
  ctx: StrategyPlanningContext;
}): readonly string[] {
  return input.ctx.budgetStrategy.allocation.map(
    (a) => `Operationalize ${a.channelOrCategory} at ${a.percentageMin ?? "?"}–${a.percentageMax ?? "?"}% per strategy`
  );
}
