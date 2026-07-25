"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAccount } from "@/components/account/AccountProvider";
import {
  buildInboxViewModel,
  type InboxViewModel,
} from "@/lib/inbox";
import { fetchMarketingUnderstanding } from "@/lib/marketing-workspace";
import { loadMarketingPeerSnapshots } from "@/lib/home";
import { getInboxCopy, resolveHomeLocale } from "@/lib/i18n";
import type { PeerRow } from "@/lib/peer-display";
import { fetchOrganizationPeers } from "@/lib/peers/queries";
import type { MarketingUnderstanding } from "@/lib/marketing-intelligence";
import { createClient } from "@/lib/supabase/client";

export type InboxPageState = "loading" | "success" | "error";

export function useInboxPage() {
  const { organizationId } = useAccount();
  const [pageState, setPageState] = useState<InboxPageState>("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [peers, setPeers] = useState<PeerRow[]>([]);
  const [understanding, setUnderstanding] = useState<MarketingUnderstanding | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const locale = resolveHomeLocale(null);
  const copy = useMemo(() => getInboxCopy(locale), [locale]);

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
      setPageState("success");
    } catch (error) {
      console.error("Inbox load failed:", error);
      setErrorMessage(
        error instanceof Error ? error.message : "We couldn't load your inbox just now."
      );
      setPageState("error");
    }
  }, [organizationId]);

  useEffect(() => {
    void load();
  }, [load, refreshKey]);

  const viewModel: InboxViewModel | null = useMemo(() => {
    if (pageState !== "success") return null;

    const marketingSnapshots = loadMarketingPeerSnapshots(peers);
    return buildInboxViewModel({
      marketingSnapshots,
      understanding,
      locale,
    });
  }, [pageState, peers, understanding, locale]);

  const retry = useCallback(() => {
    setRefreshKey((key) => key + 1);
  }, []);

  return {
    pageState,
    errorMessage,
    viewModel,
    copy,
    retry,
    inboxCount: viewModel?.items.length ?? 0,
  };
}
