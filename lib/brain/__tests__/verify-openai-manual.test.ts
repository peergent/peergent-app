/**
 * Manual OpenAI verification — never runs in default `npm test`.
 *
 * Estimated cost: one strategy request ≈ $0.01–0.05 depending on model/context.
 *
 * Usage:
 *   set -a && source .env.local && set +a && BRAIN_VERIFY_OPENAI=1 npm run brain:verify-openai
 */
import { describe, expect, it } from "vitest";
import { executeBrainForWorkflowStep } from "@/lib/brain/integration/execute-brain-for-workflow-step";
import { createBrainRepositoriesForServer } from "@/lib/brain/persistence/repository-factory-server";
import {
  buildOpenAiVerificationFixture,
  printOpenAiVerifySafeMetadata,
} from "./verify-openai-fixture";

const manual = process.env.BRAIN_VERIFY_OPENAI === "1";

describe.skipIf(!manual)("manual OpenAI brain verification", () => {
  it("executes one live strategy request and prints safe metadata", async () => {
    if (process.env.BRAIN_USE_OPENAI !== "true") {
      throw new Error("BRAIN_USE_OPENAI must be true");
    }
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY must be set");
    }

    const startedMs = Date.now();
    const { project, domainInput } = buildOpenAiVerificationFixture();
    const repositories = createBrainRepositoriesForServer({
      environment: "live",
      peerId: "emma",
    });

    const result = await executeBrainForWorkflowStep(
      {
        stepId: "strategy_determined",
        peerId: "emma",
        project,
        domainInput,
        locale: "en",
      },
      { repositories }
    );

    const latencyMs = Date.now() - startedMs;
    expect(result).not.toBeNull();
    expect(result!.run.status).not.toBe("waiting_for_input");
    expect(result!.output).not.toBeNull();

    const meta = {
      provider: result!.run.usage.providerId,
      model: result!.run.usage.modelId,
      inputTokens: result!.run.usage.inputTokens,
      outputTokens: result!.run.usage.outputTokens,
      latencyMs,
      validation: result!.output ? ("output_present" as const) : ("missing" as const),
      fallback: result!.run.usage.providerId !== "llm",
    };

    printOpenAiVerifySafeMetadata(meta);
    expect(result!.run.status).toMatch(/completed|partial|waiting_for_approval/);
    expect(result!.run.usage.providerId).toBe("llm");
  });
});
