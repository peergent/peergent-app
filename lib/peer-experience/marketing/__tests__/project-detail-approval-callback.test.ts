import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import type { ComponentProps } from "react";
import ProjectDetailTab from "@/features/marketing-workspace/details/ProjectDetailTab";
import type { CampaignApprovalResult } from "@/lib/peer-experience/marketing/campaign-approval";

type ProjectDetailApproveHandler = NonNullable<
  ComponentProps<typeof ProjectDetailTab>["onApproveCampaign"]
>;

/** Regression: workspace.handleApproveCampaign must assign to ProjectDetailTab.onApproveCampaign. */
const workspaceStyleApproveHandler: ProjectDetailApproveHandler = async (input: {
  projectId: string;
}): Promise<CampaignApprovalResult> => ({
  ok: true,
  projectId: input.projectId,
  status: "approved",
  message: "Approved",
  publicationUnlocked: true,
  continuationStarted: false,
});

describe("ProjectDetailTab approval callback contract", () => {
  it("accepts workspace-style onApproveCampaign(input: { projectId })", async () => {
    const result = await workspaceStyleApproveHandler({ projectId: "camp-1" });
    expect(result.projectId).toBe("camp-1");
    expect(result.ok).toBe(true);
  });

  it("passes onApproveCampaign through without projectId string adapter", () => {
    const src = read("features/marketing-workspace/details/ProjectDetailTab.tsx");
    expect(src).not.toContain("onApproveCampaign(input.projectId)");
    expect(src).toContain("onApproveCampaign={onApproveCampaign}");
  });
});

function read(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}
