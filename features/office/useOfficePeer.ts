"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { useParams } from "next/navigation";
import { useAccount } from "@/components/account/AccountProvider";
import { useMarketingWorkspace } from "@/hooks/useMarketingWorkspace";
import { buildMarketingPeerDomainInput } from "@/features/studio/marketing-peer/buildMarketingPeerDomainInput";
import { loadIntegrationConnections } from "@/lib/integrations/connection-store";
import { customerLocalePreferenceFromEnv } from "@/lib/i18n/resolve-customer-locale-preference";
import { selectCanonicalCustomerPeers } from "@/lib/customer-v17/select-canonical-customer-peers";
import { fetchOrganizationPeers } from "@/lib/peers/queries";
import { createClient } from "@/lib/supabase/client";
import type { PeerRow } from "@/lib/peer-display";
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
import {
  getDemoCampaignSnapshot,
  getDemoCampaignSnapshotServer,
  subscribeDemoCampaignStore,
} from "@/lib/office/demo/demo-campaign-store";
import { mergeDemoCampaignSnapshot } from "@/lib/office/demo/merge-demo-domain";
import {
  buildLiveVisionRoster,
  DEMO_VISION_ROSTER,
} from "@/lib/office/vision-roster";
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

  const [livePeers, setLivePeers] = useState<PeerRow[]>([]);

  useEffect(() => {
    if (demo || !organizationId) return;

    let cancelled = false;
    void (async () => {
      try {
        const supabase = createClient();
        const rows = await fetchOrganizationPeers(supabase, organizationId);
        if (!cancelled) setLivePeers(selectCanonicalCustomerPeers(rows));
      } catch {
        if (!cancelled) setLivePeers([]);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [demo, organizationId]);

  const liveRoster = useMemo(() => {
    if (demo) return DEMO_VISION_ROSTER;
    if (!organizationId) return [];
    return buildLiveVisionRoster(livePeers);
  }, [demo, organizationId, livePeers]);

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

  const demoCampaignSnapshot = useSyncExternalStore(
    subscribeDemoCampaignStore,
    getDemoCampaignSnapshot,
    getDemoCampaignSnapshotServer
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
  const demoDomainInput = useMemo(() => {
    const base = buildDemoDomainInput({
      userName: account?.fullName ?? "there",
      responsibilities: demoResponsibilities,
    });
    return mergeDemoCampaignSnapshot(base, demoCampaignSnapshot);
  }, [account?.fullName, demoResponsibilities, demoCampaignSnapshot]);

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
    roster: liveRoster,
    openNewCampaign,
    newCampaignModal,
  };
}
