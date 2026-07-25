"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAccount } from "@/components/account/AccountProvider";
import { fetchMarketingUnderstanding } from "@/lib/marketing-workspace";
import {
  adaptHandoffState,
  buildHomeViewModel,
  loadMarketingPeerSnapshots,
  readLastHomeVisit,
  writeLastHomeVisit,
} from "@/lib/home";
import type { HomeViewModel } from "@/lib/home";
import type { HomePeerWorkspaceSnapshot } from "@/lib/home/types";
import { buildInboxViewModel } from "@/lib/inbox";
import { handoffPreviewState, HANDOFF_PREVIEW_SCENES } from "@/lib/home/handoff-demo";
import { enrichHandoffVisual, HANDOFF_REFERENCE_DEMO } from "@/lib/home/handoff-visual";
import type { HandoffScene, HandoffState } from "@/lib/home/handoff-types";
import { getHomeCopy, resolveHomeLocale } from "@/lib/i18n";
import type { PeerRow } from "@/lib/peer-display";
import { fetchOrganizationPeers } from "@/lib/peers/queries";
import type { MarketingUnderstanding } from "@/lib/marketing-intelligence";
import { createClient } from "@/lib/supabase/client";

export type HandoffPageState = "loading" | "success" | "error";

export type HandoffHomeState = {
  pageState: HandoffPageState;
  errorMessage: string;
  handoff: HandoffState | null;
  viewModel: HomeViewModel | null;
  marketingSnapshots: HomePeerWorkspaceSnapshot[];
  copy: ReturnType<typeof getHomeCopy>;
  retry: () => void;
  previewBanner: string | null;
  inboxCount: number;
};

function isPreviewScene(value: string | null): value is HandoffScene {
  return HANDOFF_PREVIEW_SCENES.includes(value as HandoffScene);
}

export function useHandoffHome() {
  const searchParams = useSearchParams();
  const previewParam = searchParams.get("handoff");
  const visualParam = searchParams.get("visual");
  const { account, organizationId } = useAccount();
  const [pageState, setPageState] = useState<HandoffPageState>("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [peers, setPeers] = useState<PeerRow[]>([]);
  const [understanding, setUnderstanding] = useState<MarketingUnderstanding | null>(null);
  const [lastVisitAt, setLastVisitAt] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const locale = resolveHomeLocale(null);
  const copy = useMemo(() => getHomeCopy(locale), [locale]);

  const previewBanner =
    visualParam === "reference"
      ? "Visual reference demo (?visual=reference)"
      : isPreviewScene(previewParam)
        ? `Preview mode: ?handoff=${previewParam} (demo data)`
        : null;

  const load = useCallback(async () => {
    if (isPreviewScene(previewParam) || visualParam === "reference") {
      setPageState("success");
      return;
    }

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
  }, [organizationId, previewParam, visualParam]);

  useEffect(() => {
    void load();
  }, [load, refreshKey]);

  useEffect(() => {
    if (pageState !== "success" || isPreviewScene(previewParam) || visualParam === "reference") return;
    writeLastHomeVisit();
  }, [pageState, previewParam, visualParam]);

  const marketingSnapshots = useMemo(() => {
    if (pageState !== "success" || isPreviewScene(previewParam) || visualParam === "reference") return [];
    return loadMarketingPeerSnapshots(peers);
  }, [pageState, peers, previewParam, visualParam, refreshKey]);

  const viewModel: HomeViewModel | null = useMemo(() => {
    if (pageState !== "success") return null;
    if (isPreviewScene(previewParam) || visualParam === "reference") return null;

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
    previewParam,
    visualParam,
    account?.fullName,
    account?.organization?.name,
    peers,
    marketingSnapshots,
    understanding,
    lastVisitAt,
    locale,
  ]);

  const handoff: HandoffState | null = useMemo(() => {
    if (pageState !== "success") return null;

    if (visualParam === "reference") {
      const firstName = account?.fullName?.split(" ")[0];
      return enrichHandoffVisual(
        {
          ...HANDOFF_REFERENCE_DEMO,
          personalGreeting: firstName ? `Good morning, ${firstName}.` : HANDOFF_REFERENCE_DEMO.personalGreeting,
          isPreview: true,
        },
        firstName
      );
    }

    if (isPreviewScene(previewParam)) {
      const firstName = account?.fullName?.split(" ")[0];
      const preview = handoffPreviewState(previewParam);
      if (firstName && previewParam === "completed") {
        return enrichHandoffVisual(
          {
            ...preview,
            personalGreeting: `Good morning, ${firstName}.`,
            headline: `${preview.primaryWork?.peerName ?? "LoLo"} finished your most important work.`,
          },
          firstName
        );
      }
      return enrichHandoffVisual(preview, firstName);
    }

    if (!viewModel) return null;

    return adaptHandoffState({
      firstName: account?.fullName?.split(" ")[0],
      peers,
      marketingSnapshots,
      understanding,
      viewModel,
      locale,
    });
  }, [
    pageState,
    previewParam,
    visualParam,
    account?.fullName,
    peers,
    marketingSnapshots,
    understanding,
    viewModel,
    locale,
  ]);

  const retry = useCallback(() => {
    setRefreshKey((value) => value + 1);
  }, []);

  const inboxCount = useMemo(() => {
    if (pageState !== "success" || isPreviewScene(previewParam) || visualParam === "reference") {
      return 0;
    }
    return buildInboxViewModel({
      marketingSnapshots,
      understanding,
      locale,
    }).items.length;
  }, [pageState, marketingSnapshots, understanding, locale, previewParam, visualParam]);

  return {
    pageState,
    errorMessage,
    handoff,
    viewModel,
    marketingSnapshots,
    copy,
    retry,
    previewBanner,
    inboxCount,
  };
}
