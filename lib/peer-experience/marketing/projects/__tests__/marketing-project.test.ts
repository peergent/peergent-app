import { describe, expect, it } from "vitest";
import { createWorkUnit } from "@/lib/peer-workflow/work-unit-engine";
import { createMarketingProject } from "@/lib/peer-experience/marketing/projects/project-engine";
import { migrateWorkspaceProjects } from "@/lib/peer-experience/marketing/projects/migrate-projects";
import {
  deriveProjectProgress,
  deriveProjectStatus,
  projectStatusLabel,
} from "@/lib/peer-experience/marketing/projects/project-engine";
import { buildMarketingProjectsViewModel } from "@/lib/peer-experience/marketing/view-models/build-marketing-projects-view-model";
import { buildMarketingProjectDetailViewModel } from "@/lib/peer-experience/marketing/view-models/build-marketing-project-detail-view-model";
import { getProjectHref } from "@/lib/peer-experience/marketing/navigation/marketing-peer-links";
import type { MarketingPeerDomainInput } from "@/lib/peer-experience/marketing/view-models/marketing-peer-domain-input";

const peerId = "peer-emma";

const baseInput: MarketingPeerDomainInput = {
  peerId,
  userName: "Djemo",
  peerName: "Emma",
  campaignTitle: "Campaign",
  generating: null,
  generatingActivity: null,
  understanding: { available: true, completeness: 80, gaps: [], summary: "", lastUpdated: "" },
  strategy: null,
  plan: null,
  drafts: [],
  publicationPackages: [],
  activityFeed: [],
  workUnits: [],
  projects: [],
  responsibilities: [],
  automations: [],
  connections: [],
};

describe("migrateWorkspaceProjects", () => {
  it("creates a project for orphan work units", () => {
    const unit = createWorkUnit({
      peerId,
      role: "Marketing",
      title: "Instagram campaign",
      deliverableKind: "instagram",
      channel: "Instagram",
      objective: "Summer sale",
      audience: null,
      needsVisual: true,
      recurrence: "once",
      rawRequest: "Create an Instagram campaign",
    });

    const result = migrateWorkspaceProjects({ workUnits: [unit], projects: [] });
    expect(result.projects).toHaveLength(1);
    expect(result.workUnits[0]?.projectId).toBe(result.projects[0]?.id);
    expect(result.projects[0]?.title).toBe("Instagram campaign");
  });
});

describe("createMarketingProject on delegation", () => {
  it("links new work unit to project", () => {
    const project = createMarketingProject({
      peerId,
      title: "Instagram Campaign",
      goal: "Summer sale",
      channel: "Instagram",
      deliverableKind: "instagram",
      rawRequest: "Create an Instagram campaign for summer sale",
      ownerLabel: "Djemo",
    });

    const unit = createWorkUnit({
      peerId,
      projectId: project.id,
      role: "Marketing",
      title: project.title,
      deliverableKind: "instagram",
      channel: "Instagram",
      objective: "Summer sale",
      audience: null,
      needsVisual: true,
      recurrence: "once",
      rawRequest: project.rawRequest,
    });

    const status = deriveProjectStatus(project, [unit], [], new Set());
    expect(projectStatusLabel(status)).toBe("Planning");
    expect(deriveProjectProgress(project, [unit], status)).toBeGreaterThan(0);
  });
});

describe("buildMarketingProjectsViewModel", () => {
  it("lists project cards instead of work units", () => {
    const project = createMarketingProject({
      peerId,
      title: "Instagram Campaign",
      goal: "Summer sale",
      channel: "Instagram",
      deliverableKind: "instagram",
      rawRequest: "Instagram campaign",
      ownerLabel: "You",
    });
    const unit = createWorkUnit({
      peerId,
      projectId: project.id,
      role: "Marketing",
      title: project.title,
      deliverableKind: "instagram",
      channel: "Instagram",
      objective: "Summer sale",
      audience: null,
      needsVisual: true,
      recurrence: "once",
      rawRequest: project.rawRequest,
    });

    const vm = buildMarketingProjectsViewModel({
      ...baseInput,
      projects: [project],
      workUnits: [unit],
    });

    expect(vm.items).toHaveLength(1);
    expect(vm.items[0]?.title).toBe("Instagram Campaign");
    expect(vm.items[0]?.href).toBe(getProjectHref(peerId, project.id));
    expect(vm.items[0]?.statusLabel).toBe("Planning");
  });
});

describe("buildMarketingProjectDetailViewModel", () => {
  it("builds project workspace sections", () => {
    const project = createMarketingProject({
      peerId,
      title: "SEO Audit",
      goal: "Improve rankings",
      channel: "seo",
      deliverableKind: "generic",
      rawRequest: "Run SEO audit",
      ownerLabel: "You",
    });

    const vm = buildMarketingProjectDetailViewModel({
      ...baseInput,
      projectId: project.id,
      projects: [project],
    });

    expect(vm?.title).toBe("SEO Audit");
    expect(vm?.sections.map((s) => s.id)).toContain("timeline");
    expect(vm?.timeline[0]?.label).toBe("Project created");
    expect(vm?.experience.hero.title).toBe("SEO Audit");
    expect(vm?.experience.timeline[0]?.message).toContain("started working");
  });
});
