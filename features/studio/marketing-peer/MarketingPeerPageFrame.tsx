"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { ArrowLeft } from "lucide-react";
import { useAccount } from "@/components/account/AccountProvider";
import { PgAlcove, PgAppShell } from "@/components/design-system";
import StudioLoadingShell from "@/features/studio/StudioLoadingShell";
import EmmaDelegation from "@/features/studio/emma-workspace/sections/EmmaDelegation";
import MarketingWorkspaceLayout from "@/features/marketing-workspace/MarketingWorkspaceLayout";
import { useMarketingWorkspace } from "@/hooks/useMarketingWorkspace";
import { loadIntegrationConnections } from "@/lib/integrations/connection-store";
import type { MarketingPeerTabId } from "@/lib/peer-experience/marketing/navigation/marketing-peer-links";
import { buildMarketingPeerDomainInput } from "./buildMarketingPeerDomainInput";

export type MarketingPeerPageFrameProps = {
  activeTab: MarketingPeerTabId;
  children: (ctx: {
    peerId: string;
    domainInput: ReturnType<typeof buildMarketingPeerDomainInput>;
    workspace: ReturnType<typeof useMarketingWorkspace>;
  }) => ReactNode;
};

export default function MarketingPeerPageFrame({
  activeTab,
  children,
}: MarketingPeerPageFrameProps) {
  const params = useParams<{ peerId: string }>();
  const peerId = params.peerId ?? "";
  const { organizationId, account } = useAccount();
  const workspace = useMarketingWorkspace(peerId, organizationId ?? "");
  const [assignOpen, setAssignOpen] = useState(false);

  const connections = useMemo(
    () => (organizationId ? loadIntegrationConnections(organizationId) : []),
    [organizationId]
  );

  const domainInput = useMemo(
    () =>
      buildMarketingPeerDomainInput({
        peerId,
        organizationId: organizationId ?? undefined,
        userName: account?.fullName ?? "there",
        peerName: workspace.peer?.name ?? "Emma",
        workspace,
        connections,
      }),
    [peerId, organizationId, account?.fullName, workspace, connections]
  );

  const delegationModel = {
    promptLabel: "What do you need?",
    placeholder: "Describe the work — e.g. Instagram campaign with image and caption…",
    emptyPrompt: "What should Emma work on?",
  };

  const userInitial =
    account?.fullName?.trim().charAt(0).toUpperCase() ||
    account?.email?.trim().charAt(0).toUpperCase() ||
    "U";

  const activeWorkUnitId =
    workspace.activeWorkUnitId ??
    workspace.syncedWorkUnits.find(
      (u) => !u.cancelled && u.status !== "published" && u.status !== "monitoring"
    )?.id;

  return (
    <main className="min-h-screen bg-[var(--pg-color-canvas)] text-[var(--pg-color-text-primary)]">
      <PgAppShell contentClassName="relative flex min-h-screen flex-col">
        {workspace.pageState === "loading" && <StudioLoadingShell />}

        {workspace.pageState === "error" && (
          <div className="p-5 md:p-8">
            <div className="mt-8 rounded-2xl border border-red-500/20 bg-red-500/10 p-8 text-center">
              <h1 className="text-xl font-semibold text-red-200">
                Could not load marketing workspace
              </h1>
              <p className="mt-3 text-sm text-red-300/90">{workspace.errorMessage}</p>
              <button
                type="button"
                onClick={() => void workspace.loadWorkspace()}
                className="pg-focus-premium mt-6 inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-sm font-medium"
              >
                <RefreshCw size={16} aria-hidden />
                Try again
              </button>
            </div>
          </div>
        )}

        {workspace.pageState === "not-found" && (
          <div className="p-5 md:p-8">
            <div className="mt-8 rounded-2xl border border-white/10 bg-[#0b1120]/90 p-8 text-center">
              <h1 className="text-2xl font-semibold">Colleague not found</h1>
              <Link href="/team" className="pg-focus-premium mt-6 inline-flex items-center gap-2 text-[var(--pg-color-accent)]">
                <ArrowLeft size={16} aria-hidden />
                Back to AI Team
              </Link>
            </div>
          </div>
        )}

        {workspace.pageState === "wrong-role" && workspace.peer && (
          <div className="p-5 md:p-8">
            <div className="mt-8 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-8 text-center">
              <h1 className="text-xl font-semibold text-amber-100">Marketing workspace only</h1>
              <p className="mt-3 text-sm text-amber-200/80">
                {workspace.peer.name} is a {workspace.peer.role} peer.
              </p>
              <Link
                href={`/peers/${workspace.peer.id}`}
                className="pg-focus-premium mt-6 inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-sm font-medium"
              >
                Open peer workspace
              </Link>
            </div>
          </div>
        )}

        {workspace.pageState === "success" && workspace.peer && (
          <MarketingWorkspaceLayout
            peer={workspace.peer}
            domainInput={domainInput}
            activeTab={activeTab}
            userInitial={userInitial}
            onMessage={() => setAssignOpen(true)}
            onPause={() => {
              if (activeWorkUnitId) {
                workspace.handleWorkTaskAction(activeWorkUnitId, {
                  kind: "pause",
                  id: "pause",
                  label: "Pause",
                });
              }
            }}
            pauseDisabled={!activeWorkUnitId}
          >
            {children({ peerId, domainInput, workspace })}
          </MarketingWorkspaceLayout>
        )}

        <PgAlcove
          open={assignOpen}
          title="Assign work"
          onClose={() => setAssignOpen(false)}
        >
          {workspace.peer && (
            <EmmaDelegation
              model={delegationModel}
              peerName={workspace.peer.name}
              onExecuteTask={async (task) => {
                await workspace.handleExecuteDelegation(task);
                setAssignOpen(false);
              }}
              busy={workspace.generating !== null}
            />
          )}
        </PgAlcove>
      </PgAppShell>
    </main>
  );
}
