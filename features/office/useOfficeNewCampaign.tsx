"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import CreateCampaignModal from "@/features/marketing-workspace/components/CreateCampaignModal";
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
 * Wires Vision v13 "+ Nieuwe campagne" to the existing Create Campaign flow.
 * Live workspaces persist via handleCreateCampaign; demo ends before persistence.
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
  const [open, setOpen] = useState(false);
  const [demoNotice, setDemoNotice] = useState<string | null>(null);

  const marketingPeer = peerRole.toLowerCase().includes("marketing");

  const openNewCampaign = useCallback(() => {
    if (!marketingPeer) return;
    setDemoNotice(null);
    setOpen(true);
  }, [marketingPeer]);

  const handleCreate = useCallback(
    async (input: CreateMarketingCampaignProjectInput) => {
      if (isDemo) {
        setDemoNotice(
          localePreference === "nl"
            ? "Campagne-opzet bekeken. In de demo wordt niets opgeslagen."
            : "Campaign setup reviewed. Nothing is saved in the demo."
        );
        setOpen(false);
        return { projectId: "demo-preview" };
      }

      const result = await workspace.handleCreateCampaign(input);
      setOpen(false);
      router.push(`/office/${peerId}/work?workspace=${result.projectId}`);
      return result;
    },
    [isDemo, localePreference, peerId, router, workspace]
  );

  const newCampaignModal =
    marketingPeer && open ? (
      <>
        <CreateCampaignModal
          open={open}
          onClose={() => setOpen(false)}
          peerId={isDemo ? "demo" : peerId}
          ownerLabel={peerName}
          peerName={peerName}
          onCreate={handleCreate}
          presentation="v17"
          localePreference={localePreference}
        />
        {demoNotice ? (
          <p
            className="fixed bottom-6 left-1/2 z-[60] -translate-x-1/2 rounded-full border border-[var(--pg-v13-line-soft)] bg-[var(--pg-v13-surface)] px-4 py-2 text-[13px] text-[var(--pg-v13-ink-soft)] shadow-lg"
            role="status"
          >
            {demoNotice}
          </p>
        ) : null}
      </>
    ) : null;

  return {
    openNewCampaign: marketingPeer ? openNewCampaign : undefined,
    newCampaignModal,
  };
}
