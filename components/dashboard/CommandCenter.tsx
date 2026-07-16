"use client";

import { useCallback, useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import ExecutiveDailyBrief from "@/components/dashboard/ExecutiveDailyBrief";
import BusinessHealthPanel from "@/components/dashboard/BusinessHealthPanel";
import BiggestOpportunities from "@/components/dashboard/BiggestOpportunities";
import RecommendedActions from "@/components/dashboard/RecommendedActions";
import WorkforcePanel from "@/components/dashboard/WorkforcePanel";
import IntelligenceCoverage from "@/components/dashboard/IntelligenceCoverage";
import RecentBusinessActivity from "@/components/dashboard/RecentBusinessActivity";
import {
  buildDataCompleteness,
  buildIntelligenceCoverage,
} from "@/lib/command-center/coverage";
import {
  buildBriefMemory,
  buildBriefReasoning,
  getBrainSystemState,
} from "@/lib/command-center/presence";
import {
  BUSINESS_DOMAINS,
  getExecutiveBrief,
  getOverallHealthState,
  OPPORTUNITIES,
  RECENT_ACTIVITY,
  RECOMMENDED_ACTIONS,
} from "@/lib/command-center/demo-data";
import { getGreeting } from "@/lib/command-center/greeting";
import type { PeerRow } from "@/lib/peer-display";
import { supabase } from "@/lib/supabase";

export default function CommandCenter() {
  const [peers, setPeers] = useState<PeerRow[]>([]);
  const [loadingPeers, setLoadingPeers] = useState(true);

  const fetchPeers = useCallback(async () => {
    setLoadingPeers(true);

    const { data, error } = await supabase
      .from("peers")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Supabase fetch error:", error);
      setPeers([]);
      setLoadingPeers(false);
      return;
    }

    setPeers(data as PeerRow[]);
    setLoadingPeers(false);
  }, []);

  useEffect(() => {
    fetchPeers();
  }, [fetchPeers]);

  const greeting = getGreeting();
  const hasWebsiteOnFile = peers.some((peer) => peer.website?.trim());
  const coverageInput = {
    peerCount: peers.length,
    hasWebsiteOnFile,
  };
  const completeness = buildDataCompleteness(coverageInput);
  const coverage = buildIntelligenceCoverage(coverageInput);
  const brief = getExecutiveBrief(peers.length > 0, hasWebsiteOnFile);
  const overallHealth = getOverallHealthState(completeness.totalPercent);
  const brainState = getBrainSystemState({
    loading: loadingPeers,
    peerCount: peers.length,
    hasWebsite: hasWebsiteOnFile,
    overallHealth,
  });
  const reasoning = buildBriefReasoning({
    peerCount: peers.length,
    hasWebsite: hasWebsiteOnFile,
    completeness,
  });
  const memory = buildBriefMemory(RECENT_ACTIVITY);

  return (
    <main className="min-h-screen bg-[#030712] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(124,58,237,0.06),transparent)]" />

      <div className="relative mx-auto flex min-h-screen max-w-[1600px]">
        <Sidebar />

        <section className="min-w-0 flex-1 p-5 md:p-8 lg:p-10">
          <div className="mb-6 flex items-center justify-end">
            <p className="text-xs text-slate-600">{greeting.workspaceName}</p>
          </div>

          <div className="space-y-20 md:space-y-24">
            <ExecutiveDailyBrief
              brief={brief}
              greeting={greeting}
              briefedAt={greeting.formattedDate}
              systemState={brainState}
              reasoning={reasoning}
              memory={memory}
            />

            <BusinessHealthPanel
              overallState={overallHealth}
              domains={BUSINESS_DOMAINS}
              completeness={completeness}
            />

            <RecommendedActions actions={RECOMMENDED_ACTIONS} />

            <BiggestOpportunities opportunities={OPPORTUNITIES} />

            <WorkforcePanel peers={peers} loading={loadingPeers} />

            <IntelligenceCoverage items={coverage} />

            <RecentBusinessActivity activities={RECENT_ACTIVITY} />
          </div>
        </section>
      </div>
    </main>
  );
}
