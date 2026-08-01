"use client";

import { useMemo, useSyncExternalStore } from "react";
import { useParams } from "next/navigation";
import { useAccount } from "@/components/account/AccountProvider";
import { useMarketingWorkspace } from "@/hooks/useMarketingWorkspace";
import { buildMarketingPeerDomainInput } from "@/features/studio/marketing-peer/buildMarketingPeerDomainInput";
import { loadIntegrationConnections } from "@/lib/integrations/connection-store";
import { customerLocalePreferenceFromEnv } from "@/lib/i18n/resolve-customer-locale-preference";
import {
  DEMO_PEER_NAME,
  DEMO_PEER_ROLE,
  buildDemoDomainInput,
  isDemoPeer,
} from "@/lib/office/demo/demo-company";
import {
  getDemoResponsibilities,
  getDemoResponsibilitiesServerSnapshot,
  subscribeDemoWorkspace,
} from "@/lib/office/demo/demo-workspace-state";
import { DEMO_VISION_ROSTER } from "@/lib/office/vision-roster";
import { useOfficeNewCampaign } from "@/features/office/useOfficeNewCampaign";

/**
 * Shared data wiring for every office destination.
 *
 * Marketing is the reference implementation (§10); when a second Peer role
 * arrives this is the single place that selects the right workspace source.
 * Destinations stay unaware of which Peer they are rendering.
 */
export function useOfficePeer() {
  const params = useParams<{ peerId: string }>();
  const peerId = params.peerId ?? "";
  const { organizationId, account } = useAccount();

  /**
   * The Demo Workspace is a curated showcase, not a workspace. It is isolated
   * by never reaching the live one: the workspace hook is called with an empty
   * peer id, which short-circuits every load and every mutation inside it, so
   * the demo cannot read from or write to a real customer's data.
   */
  const demo = isDemoPeer(peerId);

  const workspace = useMarketingWorkspace(
    demo ? "" : peerId,
    demo ? "" : (organizationId ?? "")
  );

  // Boundaries a prospect has moved. Module-scoped, so the change holds while
  // they navigate between destinations and is gone on reload.
  const demoResponsibilities = useSyncExternalStore(
    subscribeDemoWorkspace,
    getDemoResponsibilities,
    getDemoResponsibilitiesServerSnapshot
  );

  const connections = useMemo(
    () => (organizationId && !demo ? loadIntegrationConnections(organizationId) : []),
    [organizationId, demo]
  );

  const peerName = demo ? DEMO_PEER_NAME : (workspace.peer?.name ?? "Emma");
  const peerRole = demo ? DEMO_PEER_ROLE : (workspace.peer?.role ?? "Marketing");

  const liveDomainInput = useMemo(
    () =>
      buildMarketingPeerDomainInput({
        peerId,
        organizationId: organizationId ?? undefined,
        userName: account?.fullName ?? "there",
        peerName,
        workspace,
        connections,
      }),
    [peerId, organizationId, account?.fullName, peerName, workspace, connections]
  );

  // Rebuilt when the account changes rather than on every render, so the demo
  // is stable across navigation but still greets the signed-in person.
  const demoDomainInput = useMemo(
    () =>
      buildDemoDomainInput({
        userName: account?.fullName ?? "there",
        responsibilities: demoResponsibilities,
      }),
    [account?.fullName, demoResponsibilities]
  );

  const { openNewCampaign, newCampaignModal } = useOfficeNewCampaign({
    peerId,
    peerName,
    peerRole,
    localePreference: customerLocalePreferenceFromEnv(),
    isDemo: demo,
    workspace,
  });

  return {
    peerId,
    peerName,
    peerRole,
    domainInput: demo ? demoDomainInput : liveDomainInput,
    workspace,
    localePreference: customerLocalePreferenceFromEnv(),
    // The demo has nothing to fetch, so it is never in a loading state.
    loading: demo ? false : workspace.pageState === "loading",
    /** True while rendering the curated showcase rather than a real workspace. */
    isDemo: demo,
    team: [] as const,
    roster: demo ? DEMO_VISION_ROSTER : ([] as const),
    openNewCampaign,
    newCampaignModal,
  };
}
