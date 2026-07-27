import type { CampaignReviewItem } from "../campaign-review/campaign-review-types";
import type { CampaignReviewDecisionHistoryMap } from "../campaign-review-decisions";
import { getCampaignArtifactVersion } from "../campaign-review-decisions/campaign-artifact-version";
import type { WorkUnit } from "@/lib/peer-workflow/work-unit";

import {
  buildRevisionSummaryBullets,
  compareArtifactSections,
} from "./compare-artifact-sections";
import type {
  CampaignArtifactCollaborationViewModel,
  CampaignFeedbackHistoryEntry,
  CampaignRevisionTimelineEntry,
  CampaignVersionHistoryEntry,
} from "./campaign-collaboration-types";
import {
  customerFeedbackLines,
  customerLabelForDecisionType,
  decisionForVersion,
  versionHistoryStatusLabel,
} from "./campaign-collaboration-labels";
import { extractComparableSections } from "./extract-comparable-sections";

function inferOldSectionsFromFeedback(input: {
  priorDecision: import("../campaign-review-decisions").CampaignReviewDecision | null;
  newSections: ReturnType<typeof extractComparableSections>;
}): ReturnType<typeof extractComparableSections> {
  if (!input.priorDecision || input.priorDecision.decision !== "changes_requested") {
    return [];
  }
  const categories = new Set(input.priorDecision.feedback?.categories ?? []);
  const message = input.priorDecision.feedback?.message?.trim();
  return input.newSections.map((section) => {
    const touched =
      categories.size > 0 ||
      Boolean(message) ||
      section.id === "cta" ||
      section.id === "hook" ||
      section.id === "subject";
    if (!touched) {
      return { ...section, value: section.value };
    }
    const hint = message || "Updated based on your feedback";
    return { ...section, value: hint };
  });
}

function buildTimeline(input: {
  workUnitId: string;
  artifactTypeLabel: string;
  peerName: string;
  currentVersion: number;
  history: readonly import("../campaign-review-decisions").CampaignReviewDecision[];
  workUnit: WorkUnit | undefined;
}): CampaignRevisionTimelineEntry[] {
  const entries: CampaignRevisionTimelineEntry[] = [];

  if (input.workUnit?.startedAt) {
    entries.push({
      id: `${input.workUnitId}-started`,
      actor: "marketing_peer",
      customerLabel: `${input.peerName} started preparing this deliverable`,
      adminLabel: `Work unit started · ${input.workUnitId}`,
      at: input.workUnit.startedAt,
      version: 1,
      decisionId: null,
    });
  }

  const sorted = [...input.history].sort((a, b) => a.decidedAt.localeCompare(b.decidedAt));
  for (const decision of sorted) {
    const actor = "customer" as const;
    entries.push({
      id: decision.id,
      actor,
      customerLabel: `You ${customerLabelForDecisionType(decision.decision).toLowerCase()}`,
      adminLabel: `Decision ${decision.id} · v${decision.artifactVersion} · ${decision.decision}`,
      at: decision.decidedAt,
      version: decision.artifactVersion,
      decisionId: decision.id,
    });

    if (
      decision.decision === "changes_requested" &&
      decision.artifactVersion < input.currentVersion
    ) {
      entries.push({
        id: `${decision.id}-revision`,
        actor: "marketing_peer",
        customerLabel: `${input.peerName} created version ${decision.artifactVersion + 1}`,
        adminLabel: `Artifact version bumped to ${decision.artifactVersion + 1}`,
        at: decision.updatedAt,
        version: decision.artifactVersion + 1,
        decisionId: null,
      });
    }
  }

  const latest = decisionForVersion(input.history, input.currentVersion);
  if (latest?.decision === "approved") {
    entries.push({
      id: `${input.workUnitId}-publish-ready`,
      actor: "system",
      customerLabel: "Ready for publishing",
      adminLabel: "Publish readiness gate passed for this artifact",
      at: latest.decidedAt,
      version: input.currentVersion,
      decisionId: latest.id,
    });
  }

  return entries.sort((a, b) => a.at.localeCompare(b.at));
}

export function buildArtifactCollaborationViewModel(input: {
  item: CampaignReviewItem;
  peerName: string;
  decisionHistory: CampaignReviewDecisionHistoryMap | undefined;
  artifactVersions: import("../campaign-review-decisions").CampaignArtifactVersionMap | undefined;
  workUnit: WorkUnit | undefined;
}): CampaignArtifactCollaborationViewModel | null {
  if (!input.item.preview) return null;

  const workUnitId = input.item.workUnitId;
  const history = input.decisionHistory?.[workUnitId] ?? [];
  const currentVersion = getCampaignArtifactVersion(workUnitId, input.artifactVersions);

  const versionEntries: CampaignVersionHistoryEntry[] = [];
  for (let version = 1; version <= currentVersion; version += 1) {
    const decision = decisionForVersion(history, version);
    const status = versionHistoryStatusLabel({
      version,
      currentVersion,
      decision,
    });
    versionEntries.push({
      version,
      isCurrent: version === currentVersion,
      customerStatusLabel: status.customerStatusLabel,
      decisionType: status.decisionType,
      decidedAt: decision?.decidedAt ?? null,
      decisionId: decision?.id ?? null,
    });
  }

  const feedbackEntries: CampaignFeedbackHistoryEntry[] = [...history]
    .sort((a, b) => a.decidedAt.localeCompare(b.decidedAt))
    .map((decision) => ({
      version: decision.artifactVersion,
      decisionType: decision.decision,
      customerLabel: customerLabelForDecisionType(decision.decision),
      feedbackLines: customerFeedbackLines(decision),
      decidedAt: decision.decidedAt,
      decisionId: decision.id,
    }));

  const newSections = extractComparableSections(input.item.preview);
  const priorVersion = currentVersion > 1 ? currentVersion - 1 : null;
  const priorDecision = priorVersion ? decisionForVersion(history, priorVersion) : null;

  let comparisonToPrevious = null;
  let revisionSummary = null;

  if (priorVersion !== null) {
    const priorContentAvailable = false;
    const oldSections = priorContentAvailable
      ? newSections
      : inferOldSectionsFromFeedback({ priorDecision, newSections });

    const comparison = compareArtifactSections({
      workUnitId,
      fromVersion: priorVersion,
      toVersion: currentVersion,
      oldSections,
      newSections,
      priorContentAvailable,
    });

    comparisonToPrevious = comparison;

    const summaryBullets = [...buildRevisionSummaryBullets(comparison)];
    if (priorDecision?.decision === "changes_requested") {
      for (const line of customerFeedbackLines(priorDecision)) {
        const bullet = `Addressed: ${line}`;
        if (!summaryBullets.includes(bullet)) {
          summaryBullets.unshift(bullet);
        }
      }
    }

    revisionSummary = {
      workUnitId,
      fromVersion: priorVersion,
      toVersion: currentVersion,
      headline: `${input.peerName} updated this deliverable`,
      bullets:
        summaryBullets.length > 0 ? summaryBullets : ["Refinements applied from your feedback."],
    };
  }

  return {
    workUnitId,
    artifactType: input.item.artifactType,
    artifactTypeLabel: input.item.artifactTypeLabel,
    title: input.item.title,
    currentVersion,
    lastUpdatedAt: input.item.updatedAt,
    versionHistory: {
      workUnitId,
      artifactType: input.item.artifactType,
      artifactTypeLabel: input.item.artifactTypeLabel,
      title: input.item.title,
      currentVersion,
      entries: versionEntries,
    },
    timeline: {
      workUnitId,
      artifactTypeLabel: input.item.artifactTypeLabel,
      entries: buildTimeline({
        workUnitId,
        artifactTypeLabel: input.item.artifactTypeLabel,
        peerName: input.peerName,
        currentVersion,
        history,
        workUnit: input.workUnit,
      }),
    },
    feedbackHistory: {
      workUnitId,
      artifactTypeLabel: input.item.artifactTypeLabel,
      entries: feedbackEntries,
    },
    comparisonToPrevious,
    revisionSummary,
  };
}
