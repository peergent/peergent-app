"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAccount } from "@/components/account/AccountProvider";
import { defaultContextEngine } from "@/lib/context-engine";
import type { ContextBundle } from "@/lib/context-engine";
import type { PeerRow } from "@/lib/peer-display";
import { fetchOrganizationPeers } from "@/lib/peers/queries";
import { createClient } from "@/lib/supabase/client";

export default function ContextPlayground() {
  const { account, loading: accountLoading } = useAccount();
  const supabase = useMemo(() => createClient(), []);
  const [peers, setPeers] = useState<PeerRow[]>([]);
  const [peersLoading, setPeersLoading] = useState(false);
  const [selectedPeerId, setSelectedPeerId] = useState<string>("");
  const [bundle, setBundle] = useState<ContextBundle | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [lazyAction, setLazyAction] = useState<"knowledge" | "brain" | null>(null);

  useEffect(() => {
    const organizationId = account?.organization?.id;

    if (!organizationId) {
      setPeers([]);
      setSelectedPeerId("");
      return;
    }

    let cancelled = false;

    async function loadPeers() {
      setPeersLoading(true);
      setError(null);

      try {
        const nextPeers = await fetchOrganizationPeers(supabase, organizationId);

        if (cancelled) {
          return;
        }

        setPeers(nextPeers);
        setSelectedPeerId((current) => current || nextPeers[0]?.id || "");
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load organization peers."
          );
        }
      } finally {
        if (!cancelled) {
          setPeersLoading(false);
        }
      }
    }

    void loadPeers();

    return () => {
      cancelled = true;
    };
  }, [account?.organization?.id, supabase]);

  const runBuild = useCallback(async () => {
    if (!account?.organization || !selectedPeerId) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await defaultContextEngine.build(
        {
          organizationId: account.organization.id,
          peerId: selectedPeerId,
          userId: account.userId,
          membershipRole: account.organization.role,
          taskHint: "Context Engine playground smoke test",
        },
        { supabase }
      );
      setBundle(result);
    } catch (err) {
      setBundle(null);
      setError(err instanceof Error ? err.message : "Failed to build context.");
    } finally {
      setLoading(false);
    }
  }, [account, selectedPeerId, supabase]);

  useEffect(() => {
    if (accountLoading || peersLoading || !selectedPeerId || !account?.organization) {
      return;
    }

    void runBuild();
  }, [account, accountLoading, peersLoading, runBuild, selectedPeerId]);

  async function runLazyLayer(layerKey: "knowledge" | "brain") {
    if (!bundle) {
      return;
    }

    setLazyAction(layerKey);
    setError(null);

    try {
      const updated = await defaultContextEngine.buildLazy(bundle, layerKey, {
        supabase,
      });
      setBundle(updated);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : `Failed to load ${layerKey} layer.`
      );
    } finally {
      setLazyAction(null);
    }
  }

  const lazyLoading = lazyAction !== null;
  const knowledgeLoaded = Boolean(bundle?.layers.knowledge);
  const brainLoaded = Boolean(bundle?.layers.brain);
  const selectedPeer = peers.find((peer) => peer.id === selectedPeerId);

  if (accountLoading) {
    return (
      <p className="text-sm text-slate-400">Loading authenticated session...</p>
    );
  }

  if (!account) {
    return (
      <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
        Sign in to inspect real organization and peer context. The playground uses
        your authenticated Supabase session.
      </div>
    );
  }

  if (!account.organization) {
    return (
      <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
        No active organization found for this account. Create or join an organization
        first.
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <header className="flex flex-col gap-2 border-b border-white/10 pb-6">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-violet-300/80">
          Developer Playground
        </p>
        <h1 className="text-2xl font-semibold text-white">Context Engine</h1>
        <p className="max-w-2xl text-sm text-slate-400">
          Inspect the ContextBundle returned by{" "}
          <code className="rounded bg-white/5 px-1.5 py-0.5 text-violet-200">
            ContextEngine.build()
          </code>{" "}
          using your authenticated organization and a real peer record. Run Website
          Intelligence first to populate Business Brain data in this browser session.
        </p>
      </header>

      <section className="grid gap-3 rounded-xl border border-white/10 bg-[#070b18] p-4 md:grid-cols-2">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">Organization</p>
          <p className="mt-1 text-sm text-white">{account.organization.name}</p>
          <p className="text-xs text-slate-400">{account.organization.slug}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">User</p>
          <p className="mt-1 text-sm text-white">{account.fullName}</p>
          <p className="text-xs text-slate-400">{account.organization.role}</p>
        </div>
        <div className="md:col-span-2">
          <label
            htmlFor="peer-select"
            className="text-xs uppercase tracking-wide text-slate-500"
          >
            Peer
          </label>
          {peersLoading ? (
            <p className="mt-2 text-sm text-slate-400">Loading peers...</p>
          ) : peers.length === 0 ? (
            <p className="mt-2 text-sm text-slate-400">
              No peers found in this organization.
            </p>
          ) : (
            <select
              id="peer-select"
              value={selectedPeerId}
              onChange={(event) => setSelectedPeerId(event.target.value)}
              className="mt-2 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
            >
              {peers.map((peer) => (
                <option key={peer.id} value={peer.id} className="bg-slate-900">
                  {peer.name} · {peer.role}
                </option>
              ))}
            </select>
          )}
          {selectedPeer ? (
            <p className="mt-2 text-xs text-slate-400">
              Objective: {selectedPeer.objective || "No objective set"}
            </p>
          ) : null}
        </div>
      </section>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => void runBuild()}
          disabled={loading || lazyLoading || !selectedPeerId}
          className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Building..." : "Rebuild"}
        </button>

        <button
          type="button"
          onClick={() => void runLazyLayer("knowledge")}
          disabled={loading || lazyLoading || !bundle}
          className="rounded-lg border border-violet-500/30 bg-violet-500/10 px-4 py-2 text-sm font-medium text-violet-100 transition hover:bg-violet-500/20 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {lazyAction === "knowledge"
            ? "Loading knowledge..."
            : 'buildLazy("knowledge")'}
        </button>

        <button
          type="button"
          onClick={() => void runLazyLayer("brain")}
          disabled={loading || lazyLoading || !bundle}
          className="rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-sm font-medium text-cyan-100 transition hover:bg-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {lazyAction === "brain"
            ? "Loading Business Brain..."
            : "Load Business Brain"}
        </button>

        {bundle ? (
          <span className="text-sm text-slate-400">
            Completeness: {bundle.meta.completeness}% · Pending lazy layers:{" "}
            {bundle.meta.pendingLazyLayers.join(", ") || "none"}
            {brainLoaded &&
            bundle.layers.brain?.sources?.[0]?.type === "supabase"
              ? " · brain source: supabase"
              : null}
          </span>
        ) : null}
      </div>

      {error ? (
        <div
          role="alert"
          className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-100"
        >
          {error}
        </div>
      ) : null}

      <section className="overflow-hidden rounded-xl border border-white/10 bg-[#070b18]">
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
          <h2 className="text-sm font-medium text-slate-200">ContextBundle</h2>
        <div className="flex items-center gap-2">
          {brainLoaded ? (
            <span className="rounded-full bg-cyan-500/10 px-2.5 py-1 text-xs font-medium text-cyan-300">
              brain loaded
            </span>
          ) : (
            <span className="rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-300">
              brain pending
            </span>
          )}
          {knowledgeLoaded ? (
            <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-300">
              knowledge loaded
            </span>
          ) : (
            <span className="rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-300">
              knowledge pending
            </span>
          )}
        </div>
        </div>

        {loading ? (
          <p className="px-4 py-6 text-sm text-slate-400">Running build()...</p>
        ) : bundle ? (
          <pre className="max-h-[70vh] overflow-auto p-4 text-xs leading-6 text-slate-200">
            {JSON.stringify(bundle, null, 2)}
          </pre>
        ) : (
          <p className="px-4 py-6 text-sm text-slate-400">
            No bundle available. Select a peer and use Rebuild to try again.
          </p>
        )}
      </section>
    </div>
  );
}
