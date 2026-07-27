import type { CampaignCollaborationBuildInput, CampaignCollaborationViewModel } from "./campaign-collaboration-types";
import { buildArtifactCollaborationViewModel } from "./build-artifact-collaboration";
import { buildCampaignPublishReadinessViewModel } from "./build-publish-readiness";
import { buildCampaignPublishTargetsViewModel } from "./build-publish-targets";

export function buildCampaignCollaborationViewModel(
  input: CampaignCollaborationBuildInput
): CampaignCollaborationViewModel {
  const artifacts = input.reviewItems
    .map((item) => {
      const workUnit = input.workUnits.find((u) => u.id === item.workUnitId);
      return buildArtifactCollaborationViewModel({
        item,
        peerName: input.peerName,
        decisionHistory: input.campaignReviewDecisionHistoryByWorkUnitId,
        artifactVersions: input.campaignArtifactVersionByWorkUnitId,
        workUnit,
      });
    })
    .filter((a): a is NonNullable<typeof a> => a !== null);

  const publishReadiness = buildCampaignPublishReadinessViewModel({
    reviewItems: input.reviewItems,
    buildInput: input,
  });

  const publishTargets = buildCampaignPublishTargetsViewModel({
    artifactTypesPresent: artifacts.map((a) => a.artifactType),
  });

  return {
    projectId: input.projectId,
    publishReadiness,
    publishTargets,
    artifacts,
  };
}

export function findArtifactCollaboration(
  vm: CampaignCollaborationViewModel,
  workUnitId: string
) {
  return vm.artifacts.find((a) => a.workUnitId === workUnitId) ?? null;
}
