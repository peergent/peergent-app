"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAccount } from "@/components/account/AccountProvider";
import { fetchMarketingUnderstanding } from "@/lib/marketing-workspace";
import {
  buildHomeViewModel,
  loadMarketingPeerSnapshots,
  readLastHomeVisit,
  writeLastHomeVisit,
  type HomeViewModel,
} from "@/lib/home";
import { getHomeCopy, resolveHomeLocale } from "@/lib/i18n";
import type { PeerRow } from "@/lib/peer-display";
import { fetchOrganizationPeers } from "@/lib/peers/queries";
import type { MarketingUnderstanding } from "@/lib/marketing-intelligence";
import { createClient } from "@/lib/supabase/client";

export type HomePageState = "loading" | "success" | "error";

export function useHomePage() {
  const { account, organizationId } = useAccount();
  const [pageState, setPageState] = useState<HomePageState>("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [peers, setPeers] = useState<PeerRow[]>([]);
  const [understanding, setUnderstanding] = useState<MarketingUnderstanding | null>(null);
  const [lastVisitAt, setLastVisitAt] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const locale = resolveHomeLocale(null);
  const copy = useMemo(() => getHomeCopy(locale), [locale]);

  const load = useCallback(async () => {
    setPageState("loading");
    setErrorMessage("");

    try {
      const supabase = createClient();
      const peerRows = await fetchOrganizationPeers(supabase, organizationId);
      setPeers(peerRows);

      let nextUnderstanding: MarketingUnderstanding | null = null;
      if (peerRows.some((peer) => peer.role === "Marketing")) {
        try {
          const result = await fetchMarketingUnderstanding();
          nextUnderstanding = result.understanding;
        } catch {
          nextUnderstanding = null;
        }
      }

      setUnderstanding(nextUnderstanding);
      setLastVisitAt(readLastHomeVisit());
      setPageState("success");
    } catch (error) {
      console.error("Home load failed:", error);
      setErrorMessage(error instanceof Error ? error.message : "Unknown error");
      setPageState("error");
    }
  }, [organizationId]);

  useEffect(() => {
    void load();
  }, [load, refreshKey]);

  useEffect(() => {
    if (pageState !== "success") return;
    writeLastHomeVisit();
  }, [pageState]);

  const marketingSnapshots = useMemo(() => {
    if (pageState !== "success") return [];
    return loadMarketingPeerSnapshots(peers);
  }, [pageState, peers, refreshKey]);

  const viewModel: HomeViewModel | null = useMemo(() => {
    if (pageState !== "success") return null;

    return buildHomeViewModel({
      firstName: account?.fullName?.split(" ")[0],
      companyName: account?.organization?.name,
      peers,
      marketingSnapshots,
      understanding,
      lastVisitAt,
      locale,
    });
  }, [
    pageState,
    account?.fullName,
    account?.organization?.name,
    peers,
    marketingSnapshots,
    understanding,
    lastVisitAt,
    locale,
  ]);

  const retry = useCallback(() => {
    setRefreshKey((value) => value + 1);
  }, []);

  return {
    pageState,
    errorMessage,
    viewModel,
    copy,
    retry,
  };
}
