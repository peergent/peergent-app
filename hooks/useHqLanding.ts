"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAccount } from "@/components/account/AccountProvider";
import { buildTeamPulseItems } from "@/lib/home/build-team-pulse";
import {
  activitySourcesFromMarketingSnapshots,
  buildHomeViewModel,
  loadMarketingPeerSnapshots,
  readLastHomeVisit,
} from "@/lib/home";
import { buildHqLandingViewModel, type HqLandingViewModel } from "@/lib/hq/build-hq-view-model";
import { dedupePeersById } from "@/lib/hq/hq-peers";
import type { HqInitialTemporal } from "@/lib/hq/hq-temporal";
import { fetchMarketingUnderstanding } from "@/lib/marketing-workspace";
import { fetchOrganizationPeers } from "@/lib/peers/queries";
import type { PeerRow } from "@/lib/peer-display";
import type { MarketingUnderstanding } from "@/lib/marketing-intelligence";
import { createClient } from "@/lib/supabase/client";

export type HqLandingPageState = "loading" | "success" | "error";

export function useHqLanding(temporal: HqInitialTemporal) {
  const { account, organizationId } = useAccount();
  const [pageState, setPageState] = useState<HqLandingPageState>("loading");
  const [peers, setPeers] = useState<PeerRow[]>([]);
  const [understanding, setUnderstanding] = useState<MarketingUnderstanding | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const load = useCallback(async () => {
    setPageState("loading");

    try {
      const supabase = createClient();
      const peerRows = dedupePeersById(await fetchOrganizationPeers(supabase, organizationId));
      setPeers(peerRows);

      if (peerRows.some((peer) => peer.role === "Marketing")) {
        try {
          const result = await fetchMarketingUnderstanding();
          setUnderstanding(result.understanding);
        } catch {
          setUnderstanding(null);
        }
      } else {
        setUnderstanding(null);
      }

      setPageState("success");
    } catch (error) {
      console.error("HQ landing load failed:", error);
      setPageState("error");
    }
  }, [organizationId]);

  useEffect(() => {
    void load();
  }, [load, refreshKey]);

  const viewModel: HqLandingViewModel | null = useMemo(() => {
    if (pageState !== "success") return null;

    const dedupedPeers = dedupePeersById(peers);
    const marketingSnapshots = loadMarketingPeerSnapshots(dedupedPeers);
    const homeVm = buildHomeViewModel({
      firstName: account?.fullName?.split(" ")[0],
      companyName: account?.organization?.name,
      peers: dedupedPeers,
      marketingSnapshots,
      understanding,
      lastVisitAt: readLastHomeVisit(),
    });

    const teamPulse = buildTeamPulseItems({
      peers: dedupedPeers,
      marketingSnapshots,
      understanding,
    });

    return buildHqLandingViewModel({
      firstName: account?.fullName?.split(" ")[0],
      teamPulse,
      workforceSummary: homeVm.workforceSummary,
      activitySources: activitySourcesFromMarketingSnapshots(marketingSnapshots),
      needsYou: homeVm.needsYou,
      temporal,
    });
  }, [pageState, account, peers, understanding, temporal]);

  const retry = useCallback(() => {
    setRefreshKey((key) => key + 1);
  }, []);

  return { pageState, viewModel, retry };
}
