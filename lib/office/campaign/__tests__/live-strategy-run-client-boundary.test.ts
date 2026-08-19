import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = resolve(__dirname, "../../../..");

function read(relativePath: string): string {
  return readFileSync(resolve(ROOT, relativePath), "utf8");
}

describe("live strategy client/server boundary", () => {
  it("client workspace actions do not import live brain execution directly", () => {
    const source = read("features/office/campaign/useCampaignWorkspaceActions.ts");
    expect(source).not.toMatch(/enqueueLiveStrategyRun/);
    expect(source).not.toMatch(/live-strategy-run-execution/);
    expect(source).not.toMatch(/executeBrainForWorkflowStep/);
    expect(source).toMatch(/triggerLiveStrategyRunViaServer/);
  });

  it("client strategy orchestrator uses server client helper", () => {
    const source = read("lib/office/campaign/live-strategy-run-client.ts");
    expect(source).toMatch(/runLiveStrategyAction/);
    expect(source).not.toMatch(/executeBrainForWorkflowStep/);
    expect(source).not.toMatch(/live-strategy-run-execution/);
  });

  it("server execution module is server-only", () => {
    const source = read("lib/office/campaign/live-strategy-run-execution.ts");
    expect(source).toMatch(/import "server-only"/);
    expect(source).toMatch(/createBrainRepositoriesForServer/);
  });

  it("LLM modules are server-only", () => {
    for (const file of [
      "lib/brain/providers/llm-brain-provider.ts",
      "lib/brain/llm/execute-strategy-llm.ts",
      "lib/brain/persistence/repository-factory-server.ts",
    ]) {
      expect(read(file)).toMatch(/import "server-only"/);
    }
  });

  it("client-safe repository factory excludes llm registration", () => {
    const source = read("lib/brain/persistence/repository-factory.ts");
    expect(source).not.toMatch(/createLlmBrainProvider/);
    expect(source).not.toMatch(/isBrainUseOpenAIEnabled/);
  });
});
