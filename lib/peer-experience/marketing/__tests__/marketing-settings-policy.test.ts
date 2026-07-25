import { describe, expect, it } from "vitest";
import {
  applyPilotSafeAutonomy,
  applyRoutinePostingAutonomous,
  applyWorkspaceAutonomyMode,
  deriveRoutinePostingAutonomous,
  deriveWorkspaceAutonomyMode,
} from "@/features/marketing-workspace/lib/marketing-settings-policy";
import { createMarketingResponsibility } from "../responsibilities/responsibility-engine";
import { RESPONSIBILITY_CATALOG } from "../responsibilities/responsibility-catalog";

describe("marketing-settings-policy", () => {
  const instagram = createMarketingResponsibility("peer-1", RESPONSIBILITY_CATALOG[0]!, {
    enabled: true,
  });

  it("derives always_ask when all enabled responsibilities are suggest/manual", () => {
    const manual = { ...instagram, autonomyLevel: "manual" as const };
    expect(deriveWorkspaceAutonomyMode([manual])).toBe("always_ask");
  });

  it("applies strategic mode to semi_autonomous", () => {
    const next = applyWorkspaceAutonomyMode([instagram], "strategic_only");
    expect(next[0]?.autonomyLevel).toBe("semi_autonomous");
  });

  it("posting toggle sets approval policy on channel responsibilities", () => {
    const linkedin = createMarketingResponsibility("peer-1", RESPONSIBILITY_CATALOG[1]!, {
      enabled: true,
    });
    const next = applyRoutinePostingAutonomous([instagram, linkedin], true);
    expect(next[0]?.approvalPolicy).toBe("fully_automatic");
    expect(next[1]?.approvalPolicy).toBe("fully_automatic");
  });

  it("posting autonomy off requires approval", () => {
    const safe = applyRoutinePostingAutonomous([instagram], false);
    expect(deriveRoutinePostingAutonomous(safe)).toBe(false);
    expect(safe[0]?.approvalPolicy).toBe("approval_required");
  });

  it("applyPilotSafeAutonomy sets budget limit zero on enabled responsibilities", () => {
    const ads = createMarketingResponsibility("peer-1", RESPONSIBILITY_CATALOG[5]!, {
      enabled: true,
    });
    const pilot = applyPilotSafeAutonomy([ads]);
    expect(pilot[0]?.guardrails.maxMonthlySpend).toBe(0);
    expect(pilot[0]?.approvalPolicy).toBe("approval_required");
  });
});
