"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAccount } from "@/components/account/AccountProvider";
import Sidebar from "@/components/Sidebar";
import EmptyTeamState from "@/components/team/EmptyTeamState";
import TeamWorkspace from "@/components/team/TeamWorkspace";
import TeamWorkspaceSkeleton from "@/components/team/TeamWorkspaceSkeleton";
import { useReducedMotion } from "@/lib/hire-team/use-reduced-motion";
import type { PeerRow } from "@/lib/peer-display";
import { fetchOrganizationPeers } from "@/lib/peers/queries";
import { createClient } from "@/lib/supabase/client";
import { buildTeamWorkspaceViewModel } from "@/lib/team";

export default function PeersPage() {
  const reducedMotion = useReducedMotion();
  const { organizationId } = useAccount();
  const [peerRows, setPeerRows] = useState<PeerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const model = useMemo(
    () => buildTeamWorkspaceViewModel(peerRows),
    [peerRows]
  );

  const fetchPeers = useCallback(async () => {
    setError("");

    try {
      const supabase = createClient();
      const data = await fetchOrganizationPeers(supabase, organizationId);
      setPeerRows(data);
    } catch (fetchError) {
      console.error("Team workspace — peer fetch failed:", fetchError);
      setError("We couldn't load your AI team just now.");
      setPeerRows([]);
    }
  }, [organizationId]);

  useEffect(() => {
    let cancelled = false;

    async function loadPeers() {
      setLoading(true);
      await fetchPeers();
      if (!cancelled) setLoading(false);
    }

    void loadPeers();

    return () => {
      cancelled = true;
    };
  }, [fetchPeers]);

  return (
    <main className="min-h-screen bg-[#030712] text-white">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-[15%] top-[5%] h-[420px] w-[420px] rounded-full bg-violet-600/[0.04] blur-[120px]" />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-[1600px]">
        <Sidebar />

        <section className="min-w-0 flex-1 overflow-x-hidden p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] md:p-8 lg:p-10">
          {error && (
            <div
              className="mb-5 rounded-[18px] border border-red-500/15 bg-red-500/[0.06] px-4 py-3 text-sm text-red-300/90"
              role="alert"
            >
              {error}
            </div>
          )}

          {loading ? (
            <TeamWorkspaceSkeleton />
          ) : model.isEmpty ? (
            <EmptyTeamState reducedMotion={reducedMotion} />
          ) : (
            <TeamWorkspace model={model} reducedMotion={reducedMotion} />
          )}
        </section>
      </div>
    </main>
  );
}
