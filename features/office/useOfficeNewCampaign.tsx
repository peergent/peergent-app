"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import CreateCampaignModal from "@/features/marketing-workspace/components/CreateCampaignModal";
import CreateCampaignModeModal, {
  type CampaignSetupMode,
} from "@/features/marketing-workspace/components/CreateCampaignModeModal";
import { createDemoCampaign } from "@/lib/office/demo/demo-campaign-store";
import type { CreateMarketingCampaignProjectInput } from "@/lib/peer-experience/marketing/projects/project-engine";
import type { useMarketingWorkspace } from "@/hooks/useMarketingWorkspace";

type Workspace = ReturnType<typeof useMarketingWorkspace>;

export type UseOfficeNewCampaignInput = {
  peerId: string;
  peerName: string;
  peerRole: string;
  localePreference?: string | null;
  isDemo: boolean;
  workspace: Workspace;
};

/**
 * Wires Vision v13 "+ Nieuwe campagne" to mode selection, then automatic or manual wizard.
 */
export function useOfficeNewCampaign({
  peerId,
  peerName,
  peerRole,
  localePreference,
  isDemo,
  workspace,
}: UseOfficeNewCampaignInput) {
  const router = useRouter();
  const [modeOpen, setModeOpen] = useState(false);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [setupMode, setSetupMode] = useState<CampaignSetupMode>("automatic");
  const [createError, setCreateError] = useState<string | null>(null);

  const marketingPeer = peerRole.toLowerCase().includes("marketing");

  const openNewCampaign = useCallback(() => {
    if (!marketingPeer) return;
    setCreateError(null);
    setModeOpen(true);
  }, [marketingPeer]);

  const handleModeSelect = useCallback((mode: CampaignSetupMode) => {
    setSetupMode(mode);
    setModeOpen(false);
    setWizardOpen(true);
  }, []);

  const handleCreate = useCallback(
    async (input: CreateMarketingCampaignProjectInput) => {
      if (isDemo) {
        const project = createDemoCampaign(
          peerId,
          input,
          localePreference === "nl" ? "nl" : "en"
        );
        setWizardOpen(false);
        router.push(`/office/${peerId}/work/campaigns/${project.id}`);
        return { projectId: project.id };
      }

      try {
        const result = await workspace.handleCreateCampaign(input);
        setWizardOpen(false);
        router.push(`/office/${peerId}/work/campaigns/${result.projectId}`);
        return result;
      } catch {
        setCreateError(
          localePreference === "nl"
            ? "De campagne kon niet worden opgeslagen. Probeer het opnieuw."
            : "The campaign could not be saved. Try again."
        );
        throw new Error("create_failed");
      }
    },
    [isDemo, localePreference, peerId, router, workspace]
  );

  const newCampaignModal =
    marketingPeer && (modeOpen || wizardOpen) ? (
      <>
        <CreateCampaignModeModal
          open={modeOpen}
          onClose={() => setModeOpen(false)}
          onSelect={handleModeSelect}
          localePreference={localePreference}
        />
        <CreateCampaignModal
          open={wizardOpen}
          onClose={() => setWizardOpen(false)}
          setupMode={setupMode}
          peerId={isDemo ? "demo" : peerId}
          ownerLabel={peerName}
          peerName={peerName}
          onCreate={handleCreate}
          presentation="v17"
          localePreference={localePreference}
          externalError={createError}
        />
      </>
    ) : null;

  return {
    openNewCampaign: marketingPeer ? openNewCampaign : undefined,
    newCampaignModal,
  };
}
