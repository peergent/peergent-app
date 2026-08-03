import type { BrainCapabilityId } from "./registry";
import type { BrainStructuredOutput } from "../evidence/structured-output";
import type { BrainRuntime } from "../runtime/brain-runtime";
import type { BrainRunRequestWithBudget } from "../runtime/run-request";
import type { CapabilityExecutionContext } from "./execution-context";
import { resolveCapabilityExecutionOrder } from "./capability-dependencies";

export async function executeCapabilityWithDependencies(input: {
  runtime: BrainRuntime;
  request: BrainRunRequestWithBudget;
  buildExecutionContext: (
    upstreamOutputs: Partial<Record<BrainCapabilityId, BrainStructuredOutput>>
  ) => CapabilityExecutionContext;
}): Promise<{
  result: Awaited<ReturnType<BrainRuntime["executeRun"]>>;
  upstreamOutputs: Partial<Record<BrainCapabilityId, BrainStructuredOutput>>;
}> {
  const order = resolveCapabilityExecutionOrder(input.request.capabilityId);
  const upstreamOutputs: Partial<Record<BrainCapabilityId, BrainStructuredOutput>> = {};

  for (const depId of order) {
    const depRequest = { ...input.request, capabilityId: depId };
    const depResult = await input.runtime.executeRun(depRequest);
    if (depResult.output) upstreamOutputs[depId] = depResult.output;
  }

  const execContext = input.buildExecutionContext(upstreamOutputs);
  void execContext;

  const result = await input.runtime.executeRun({
    ...input.request,
    correlationId: `${input.request.correlationId ?? "run"}-final`,
  });

  return { result, upstreamOutputs };
}

export function executeCapabilityWithDependenciesSync(input: {
  runtime: BrainRuntime;
  request: BrainRunRequestWithBudget;
  buildExecutionContext: (
    upstreamOutputs: Partial<Record<BrainCapabilityId, BrainStructuredOutput>>
  ) => CapabilityExecutionContext;
  setExecutionContext: (ctx: CapabilityExecutionContext) => void;
}): {
  result: ReturnType<BrainRuntime["executeRunSync"]>;
  upstreamOutputs: Partial<Record<BrainCapabilityId, BrainStructuredOutput>>;
} {
  const order = resolveCapabilityExecutionOrder(input.request.capabilityId);
  const upstreamOutputs: Partial<Record<BrainCapabilityId, BrainStructuredOutput>> = {};

  for (const depId of order) {
    const depRequest = { ...input.request, capabilityId: depId };
    input.setExecutionContext(input.buildExecutionContext(upstreamOutputs));
    const depResult = input.runtime.executeRunSync(depRequest);
    if (depResult.output) upstreamOutputs[depId] = depResult.output;
  }

  input.setExecutionContext(input.buildExecutionContext(upstreamOutputs));
  const result = input.runtime.executeRunSync(input.request);

  return { result, upstreamOutputs };
}
