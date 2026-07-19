import { describe, expect, it } from "vitest";
import { buildPromptPackage } from "../prompt-builder";
import { createMarketingBundle, createTestBundle } from "./fixtures";

describe("buildPromptPackage", () => {
  it("builds a Sales role prompt with sales-specific priorities", () => {
    const prompt = buildPromptPackage(createTestBundle({ role: "Sales" }), {
      taskHint: "Review this inbound lead",
    });

    expect(prompt.metadata.peerRole).toBe("Sales");
    expect(prompt.systemPrompt).toContain("sales-focused AI peer");
    expect(prompt.systemPrompt).toContain("Lead qualification");
    expect(prompt.includedLayers).toContain("brain");
    expect(prompt.contextSections.some((section) => section.title === "Business Brain")).toBe(
      true
    );
  });

  it("builds a Marketing role prompt with marketing-specific context", () => {
    const prompt = buildPromptPackage(createMarketingBundle(), {
      taskHint: "Draft campaign messaging",
    });

    expect(prompt.metadata.peerRole).toBe("Marketing");
    expect(prompt.systemPrompt).toContain("marketing-focused AI peer");
    expect(prompt.systemPrompt).toContain("Audience alignment");
    expect(prompt.contextSections.some((section) => section.body.includes("Products"))).toBe(
      true
    );
  });

  it("warns when Business Brain is missing", () => {
    const prompt = buildPromptPackage(createTestBundle({ brain: null }));

    expect(prompt.warnings).toContain("Business Brain unavailable");
    expect(prompt.contextSections.some((section) => section.title === "Business Brain")).toBe(
      false
    );
  });

  it("warns when no products are identified", () => {
    const prompt = buildPromptPackage(createTestBundle());

    expect(prompt.warnings).toContain("No products identified");
  });

  it("does not leak telemetry or source IDs into prompts", () => {
    const prompt = buildPromptPackage(
      createTestBundle({ includeTelemetry: true, includeKnowledge: true })
    );

    expect(prompt.systemPrompt).not.toContain("session-test-trace");
    expect(prompt.taskPrompt).not.toContain("session-test-trace");
    expect(prompt.systemPrompt).not.toContain("org-test-123");
    expect(prompt.systemPrompt).not.toContain("peer-test-456");
    expect(prompt.systemPrompt).not.toContain("supabase");
    expect(prompt.systemPrompt).not.toContain("stub:");
    expect(prompt.excludedLayers).toContain("telemetry");
    expect(prompt.metadata.traceId).toBe("session-test-trace");
    expect(prompt.metadata.organizationId).toBe("org-test-123");
  });

  it("falls back for unsupported roles", () => {
    const prompt = buildPromptPackage(createTestBundle({ role: "Finance" }));

    expect(prompt.systemPrompt).toContain("AI peer assisting with the organization's stated objective");
    expect(prompt.metadata.peerRole).toBe("Finance");
  });
});
