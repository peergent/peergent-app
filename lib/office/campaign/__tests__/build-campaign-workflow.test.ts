import { describe, expect, it } from "vitest";
import { buildDemoDomainInput } from "@/lib/office/demo/demo-company";
import { buildCampaignDetailViewModel } from "@/lib/office/campaign/build-campaign-detail";
import { buildCampaignWorkflowViewModel } from "@/lib/office/campaign/build-campaign-workflow";
import { executionModeFromApprovalMode } from "@/lib/office/campaign/workflow-types";

describe("buildCampaignWorkflowViewModel", () => {
  const domainInput = buildDemoDomainInput({ locale: "nl" });
  const project = domainInput.projects.find((p) => p.id === "camp-heatpump")!;

  it("builds interactive workflow steps for heatpump demo campaign", () => {
    const workflow = buildCampaignWorkflowViewModel({
      peerId: "demo",
      project,
      domainInput,
      locale: "nl",
    });

    expect(workflow.steps.length).toBeGreaterThan(5);
    expect(workflow.steps.some((s) => s.state === "done" && s.hasEvidence)).toBe(true);
    expect(workflow.approvalCenter.count).toBeGreaterThan(0);
    expect(workflow.deliverables.length).toBeGreaterThan(0);
    expect(workflow.nextStep).toMatch(/goedkeuring|approval/i);
  });

  it("maps approval modes to execution modes", () => {
    expect(executionModeFromApprovalMode("approval_before_generation")).toBe("manual");
    expect(executionModeFromApprovalMode("approval_before_publication")).toBe("semi_automatic");
    expect(executionModeFromApprovalMode("no_approval_required")).toBe("fully_automatic");
  });

  it("includes workflow on campaign detail view model", () => {
    const detail = buildCampaignDetailViewModel({
      peerId: "demo",
      projectId: "camp-heatpump",
      domainInput,
      locale: "nl",
    });

    expect(detail?.workflow.approvalCenter.count).toBeGreaterThan(0);
    expect(detail?.workflow.steps.find((s) => s.id === "waiting_for_approval")?.state).toBe(
      "active"
    );
  });
});
