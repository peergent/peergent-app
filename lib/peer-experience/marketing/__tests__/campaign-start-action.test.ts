import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import type { CampaignExecutionPlanViewModel } from "@/lib/peer-experience/marketing/campaign-planning/campaign-execution-plan-view-model";
import type { CampaignExecutionWorkspaceResult } from "@/lib/peer-experience/marketing/campaign-execution";
import { rawRequestWithExecutorOperationId } from "@/lib/peer-experience/marketing/campaign-execution";
import type { WorkUnit } from "@/lib/peer-workflow/work-unit";
import {
  buildCampaignStartActionViewModel,
  presentCampaignStartFeedback,
  projectHasCampaignExecutionWork,
} from "@/features/marketing-workspace/lib/campaign-start-action-presenter";

const repoRoot = join(process.cwd());
const read = (relativePath: string) =>
  readFileSync(join(repoRoot, relativePath), "utf8");

const projectId = "project-campaign-1";

function basePlan(
  overrides: Partial<CampaignExecutionPlanViewModel> = {}
): CampaignExecutionPlanViewModel {
  return {
    availability: "visible",
    overallStatus: "ready",
    statusLabel: "Ready",
    objective: "Launch",
    progressSummary: "0 of 3",
    planStepsComplete: 0,
    planStepsTotal: 3,
    phases: [],
    workItems: [],
    approvalMoments: [],
    blockers: [],
    missingInformation: [],
    warnings: [],
    nextPlannedStep: null,
    ...overrides,
  };
}

function baseInput(
  overrides: Partial<Parameters<typeof buildCampaignStartActionViewModel>[0]> = {}
) {
  return {
    campaignsEnabled: true,
    projectOrigin: "campaign_wizard" as const,
    projectId,
    workUnits: [] as readonly WorkUnit[],
    executionPlan: basePlan(),
    ...overrides,
  };
}

function workspaceResult(
  status: CampaignExecutionWorkspaceResult["status"],
  extra: Partial<CampaignExecutionWorkspaceResult> = {}
): CampaignExecutionWorkspaceResult {
  return {
    status,
    campaignId: projectId,
    plannerStatus: "ready",
    executionStatus: "applied",
    createdWorkUnitIds: [],
    updatedWorkUnitIds: [],
    campaignUpdated: false,
    warnings: [],
    executedAt: "2026-07-24T12:00:00.000Z",
    ...extra,
  };
}

function workUnitWithExecutorOp(id: string): WorkUnit {
  return {
    id,
    projectId,
    peerId: "peer-emma",
    organizationId: "org-1",
    title: "Campaign step",
    status: "pending",
    cancelled: false,
    rawRequest: rawRequestWithExecutorOperationId(`op-${id}`, "Create deliverable"),
    createdAt: "2026-07-24T12:00:00.000Z",
    updatedAt: "2026-07-24T12:00:00.000Z",
  };
}

describe("buildCampaignStartActionViewModel", () => {
  it("hides action when campaign workspace flag is off", () => {
    const vm = buildCampaignStartActionViewModel(
      baseInput({ campaignsEnabled: false })
    );
    expect(vm.showAction).toBe(false);
  });

  it("hides action for legacy manual projects", () => {
    const vm = buildCampaignStartActionViewModel(
      baseInput({ projectOrigin: "manual_assignment" })
    );
    expect(vm.showAction).toBe(false);
  });

  it("shows enabled Start campaign when plan is ready and not started", () => {
    const vm = buildCampaignStartActionViewModel(baseInput());
    expect(vm.showAction).toBe(true);
    expect(vm.kind).toBe("ready");
    expect(vm.buttonLabel).toBe("Start campaign");
    expect(vm.buttonDisabled).toBe(false);
  });

  it("shows Campaign started when executor work already exists", () => {
    const vm = buildCampaignStartActionViewModel(
      baseInput({
        workUnits: [workUnitWithExecutorOp("wu-1")],
      })
    );
    expect(vm.kind).toBe("already_started");
    expect(vm.buttonLabel).toBe("Campaign started");
    expect(vm.buttonDisabled).toBe(true);
  });

  it("shows Starting campaign… while pending", () => {
    const vm = buildCampaignStartActionViewModel(baseInput({ pending: true }));
    expect(vm.buttonLabel).toBe("Starting campaign…");
    expect(vm.buttonDisabled).toBe(true);
  });

  it("disables with blocker explanation when plan is blocked", () => {
    const vm = buildCampaignStartActionViewModel(
      baseInput({
        executionPlan: basePlan({
          overallStatus: "blocked",
          blockers: ["Connect LinkedIn before starting."],
        }),
      })
    );
    expect(vm.kind).toBe("blocked");
    expect(vm.buttonDisabled).toBe(true);
    expect(vm.helperText).toContain("LinkedIn");
  });

  it("disables with restriction helper when plan is restricted", () => {
    const vm = buildCampaignStartActionViewModel(
      baseInput({
        executionPlan: basePlan({
          overallStatus: "restricted",
          restrictionMessage: "Add at least one channel.",
        }),
      })
    );
    expect(vm.kind).toBe("restricted");
    expect(vm.buttonDisabled).toBe(true);
    expect(vm.helperText).toContain("channel");
  });

  it("disables with calm message when plan is unavailable", () => {
    const vm = buildCampaignStartActionViewModel(
      baseInput({
        executionPlan: basePlan({
          availability: "unavailable",
          unavailableMessage: "Finish campaign setup first.",
        }),
      })
    );
    expect(vm.kind).toBe("unavailable");
    expect(vm.buttonDisabled).toBe(true);
    expect(vm.helperText).toContain("Finish campaign setup");
  });
});

describe("projectHasCampaignExecutionWork", () => {
  it("detects applied executor markers on project work units", () => {
    expect(
      projectHasCampaignExecutionWork(projectId, [workUnitWithExecutorOp("wu-1")])
    ).toBe(true);
    expect(
      projectHasCampaignExecutionWork(projectId, [
        { ...workUnitWithExecutorOp("wu-2"), projectId: "other" },
      ])
    ).toBe(false);
  });
});

describe("presentCampaignStartFeedback", () => {
  it("maps started to success without raw errors", () => {
    const fb = presentCampaignStartFeedback(workspaceResult("started"));
    expect(fb.tone).toBe("success");
    expect(fb.message).toBe("Campaign work started.");
    expect(fb.marksStarted).toBe(true);
  });

  it("maps already_started to info", () => {
    const fb = presentCampaignStartFeedback(workspaceResult("already_started"));
    expect(fb.tone).toBe("info");
    expect(fb.marksStarted).toBe(true);
  });

  it("maps partially_started to warning", () => {
    const fb = presentCampaignStartFeedback(workspaceResult("partially_started"));
    expect(fb.tone).toBe("warning");
    expect(fb.message).toContain("attention");
    expect(fb.marksStarted).toBe(true);
  });

  it("maps restricted without pretending success", () => {
    const fb = presentCampaignStartFeedback(
      workspaceResult("restricted", {
        nextAction: { label: "Review plan", reason: "Add channels first." },
      })
    );
    expect(fb.tone).toBe("warning");
    expect(fb.marksStarted).toBe(false);
    expect(fb.message).toBe("Add channels first.");
  });

  it("maps blocked with safe reason fallback", () => {
    const fb = presentCampaignStartFeedback(workspaceResult("blocked"));
    expect(fb.marksStarted).toBe(false);
    expect(fb.message).toContain("blocked");
  });

  it("maps failed to calm retry message", () => {
    const fb = presentCampaignStartFeedback(
      workspaceResult("failed", {
        nextAction: {
          label: "Error",
          reason: "Raw persistence stack trace should never show",
        },
      })
    );
    expect(fb.tone).toBe("error");
    expect(fb.message).toBe("Campaign could not be started. Try again.");
    expect(fb.message).not.toContain("stack");
  });
});

describe("CampaignStartCampaignAction UI contract", () => {
  const src = read("features/marketing-workspace/components/CampaignStartCampaignAction.tsx");

  it("uses real button, disabled attribute, and live region feedback", () => {
    expect(src).toContain('type="button"');
    expect(src).toContain("disabled={viewModel.buttonDisabled}");
    expect(src).toContain('role="status"');
    expect(src).toContain('aria-live="polite"');
  });

  it("opens confirmation before invoking handler", () => {
    expect(src).toContain("setConfirmOpen(true)");
    expect(src).toContain("onStartCampaignExecution(projectId)");
    expect(src).toContain('data-testid="mw-campaign-start-confirm"');
  });

  it("prevents duplicate handler calls while pending", () => {
    expect(src).toContain("pendingRef.current");
    expect(src).toMatch(/if \(pendingRef\.current\) return/);
  });

  it("shows approval and publishing reassurance in confirmation", () => {
    expect(src).toContain("Nothing will be published automatically");
    expect(src).toContain("Approval settings remain active");
    expect(src).toContain("work items");
  });

  it("disables Escape and overlay close while submitting", () => {
    expect(src).toContain("closeOnEscape={!pending}");
    expect(src).toContain("closeOnOverlayClick={!pending}");
  });

  it("does not invoke AI or content generation", () => {
    expect(src).not.toMatch(/generateContent|openai|anthropic|fetch\(/i);
  });
});

describe("Start campaign wiring", () => {
  it("passes handleStartCampaignExecution from project page frame", () => {
    const page = read("app/team/[peerId]/projects/[projectId]/page.tsx");
    expect(page).toContain("workspace.handleStartCampaignExecution");
    expect(page).toContain("onStartCampaignExecution");
  });

  it("places single Start action in campaign detail hero", () => {
    const detail = read("features/marketing-workspace/components/CampaignDetailSections.tsx");
    expect(detail).toContain("CampaignStartCampaignAction");
    expect(detail).toMatch(/mw-detail-hero[\s\S]*CampaignStartCampaignAction/);
    expect(detail.match(/<CampaignStartCampaignAction/g)?.length).toBe(1);
  });

  it("ProjectDetailTab forwards workspace props to campaign sections", () => {
    const tab = read("features/marketing-workspace/details/ProjectDetailTab.tsx");
    expect(tab).toContain("onStartCampaignExecution");
    expect(tab).toContain("campaignsEnabled={campaignsEnabled}");
    expect(tab).toContain("workUnits={domainInput.workUnits}");
    expect(tab).toContain("projectOrigin={project?.origin}");
  });
});
