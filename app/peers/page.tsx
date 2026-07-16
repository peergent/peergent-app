"use client";

import { useCallback, useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import NewPeerModal from "@/components/NewPeerModal";
import { mapPeerToDisplay, type DisplayPeer, type PeerRow } from "@/lib/peer-display";
import { supabase } from "@/lib/supabase";
import { Bot, MessageSquare, Plus } from "lucide-react";

function PeerCardSkeleton() {
  return (
    <article className="overflow-hidden rounded-2xl border border-white/10 bg-[#0b1120]/90 shadow-xl shadow-black/10">
      <div className="animate-pulse p-6">
        <div className="flex items-start gap-4">
          <div className="h-12 w-12 shrink-0 rounded-2xl bg-white/10" />
          <div className="flex-1 space-y-2">
            <div className="h-5 w-40 rounded bg-white/10" />
            <div className="h-4 w-32 rounded bg-white/10" />
          </div>
        </div>
        <div className="mt-5 space-y-2">
          <div className="h-4 w-full rounded bg-white/10" />
          <div className="h-4 w-3/4 rounded bg-white/10" />
        </div>
        <div className="mt-6 h-16 rounded-xl bg-white/10" />
        <div className="mt-5 grid grid-cols-3 gap-3">
          <div className="h-16 rounded-xl bg-white/10" />
          <div className="h-16 rounded-xl bg-white/10" />
          <div className="h-16 rounded-xl bg-white/10" />
        </div>
      </div>
      <div className="border-t border-white/10 px-6 py-4">
        <div className="h-4 w-32 animate-pulse rounded bg-white/10" />
      </div>
    </article>
  );
}

export default function PeersPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [peers, setPeers] = useState<DisplayPeer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchPeers = useCallback(async () => {
    setError("");

    const { data, error: fetchError } = await supabase
      .from("peers")
      .select("*")
      .order("created_at", { ascending: false });

    if (fetchError) {
      console.error("Supabase fetch error:", fetchError);
      setError(fetchError.message || "Failed to load AI Peers.");
      setPeers([]);
      return;
    }

    setPeers((data as PeerRow[]).map(mapPeerToDisplay));
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadPeers() {
      setLoading(true);
      await fetchPeers();
      if (!cancelled) {
        setLoading(false);
      }
    }

    loadPeers();

    return () => {
      cancelled = true;
    };
  }, [fetchPeers]);

  async function handlePeerCreated() {
    setLoading(true);
    await fetchPeers();
    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#030712] via-[#081028] to-[#140b2e] text-white">
      <div className="mx-auto flex min-h-screen max-w-[1600px]">
        <Sidebar />

        <section className="min-w-0 flex-1 p-5 md:p-8">
          <header className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-medium text-violet-400">AI Peers</p>

              <h1 className="mt-1 text-3xl font-semibold tracking-tight md:text-4xl">
                Your AI workforce
              </h1>

              <p className="mt-2 max-w-2xl text-slate-400">
                Create, manage and monitor the AI peers working alongside your
                team.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="flex w-fit items-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-sm font-medium shadow-lg shadow-violet-950/40 transition hover:bg-violet-500"
            >
              <Plus size={18} />
              New AI Peer
            </button>
          </header>

          <section className="mt-8 grid gap-4 sm:grid-cols-3">
            <article className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur">
              <p className="text-sm text-slate-400">Active peers</p>
              <p className="mt-3 text-3xl font-semibold">
                {loading ? "—" : peers.length}
              </p>
              <p className="mt-2 text-sm text-emerald-400">
                All systems operational
              </p>
            </article>

            <article className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur">
              <p className="text-sm text-slate-400">Tasks completed today</p>
              <p className="mt-3 text-3xl font-semibold">143</p>
              <p className="mt-2 text-sm text-violet-400">
                18% more than yesterday
              </p>
            </article>

            <article className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur">
              <p className="text-sm text-slate-400">Hours saved this week</p>
              <p className="mt-3 text-3xl font-semibold">42h</p>
              <p className="mt-2 text-sm text-blue-400">
                Estimated value: €1,680
              </p>
            </article>
          </section>

          <section className="mt-8">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">Active AI Peers</h2>
                <p className="mt-1 text-sm text-slate-400">
                  Follow their live status and performance.
                </p>
              </div>

              <button
                type="button"
                className="hidden items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300 transition hover:bg-white/10 sm:flex"
              >
                <MessageSquare size={17} />
                View all activity
              </button>
            </div>

            {error && (
              <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {error}
              </div>
            )}

            {loading ? (
              <div className="grid gap-5 xl:grid-cols-2">
                <PeerCardSkeleton />
                <PeerCardSkeleton />
                <PeerCardSkeleton />
                <PeerCardSkeleton />
              </div>
            ) : peers.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-[#0b1120]/50 px-6 py-16 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-500/15">
                  <Bot size={28} className="text-violet-400" />
                </div>

                <h3 className="mt-5 text-lg font-semibold">No AI Peers yet</h3>

                <p className="mt-2 max-w-md text-sm leading-6 text-slate-400">
                  Create your first digital colleague to start building your AI
                  workforce.
                </p>

                <button
                  type="button"
                  onClick={() => setModalOpen(true)}
                  className="mt-6 flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-sm font-medium shadow-lg shadow-violet-950/40 transition hover:bg-violet-500"
                >
                  <Plus size={18} />
                  Create your first AI Peer
                </button>
              </div>
            ) : (
              <div className="grid gap-5 xl:grid-cols-2">
                {peers.map((peer) => {
                  const Icon = peer.icon;

                  return (
                    <article
                      key={peer.id}
                      className="group overflow-hidden rounded-2xl border border-white/10 bg-[#0b1120]/90 shadow-xl shadow-black/10 transition hover:-translate-y-0.5 hover:border-violet-500/30"
                    >
                      <div className="p-6">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex gap-4">
                            <div
                              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${peer.gradient} shadow-lg`}
                            >
                              <Icon size={23} />
                            </div>

                            <div>
                              <h3 className="text-lg font-semibold">
                                {peer.name}
                              </h3>

                              <p className="mt-1 text-sm text-violet-400">
                                {peer.role}
                              </p>
                            </div>
                          </div>

                          {peer.isActive && (
                            <span className="flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
                              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
                              Live
                            </span>
                          )}
                        </div>

                        <p className="mt-5 text-sm leading-6 text-slate-400">
                          {peer.description}
                        </p>

                        <div className="mt-6 rounded-xl border border-white/10 bg-white/[0.025] p-4">
                          <div className="flex items-center gap-3">
                            <Bot
                              size={17}
                              className="shrink-0 text-violet-400"
                            />

                            <div>
                              <p className="text-xs uppercase tracking-wider text-slate-500">
                                Currently working
                              </p>

                              <p className="mt-1 text-sm text-slate-200">
                                {peer.status}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="mt-5 grid grid-cols-3 gap-3">
                          {peer.stats.map((stat) => (
                            <div
                              key={stat.label}
                              className="rounded-xl bg-white/[0.035] p-3"
                            >
                              <p className="text-lg font-semibold">
                                {stat.value}
                              </p>
                              <p className="mt-1 text-xs text-slate-500">
                                {stat.label}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center justify-between border-t border-white/10 px-6 py-4">
                        <p className="text-xs text-slate-500">{peer.activity}</p>

                        <button
                          type="button"
                          className="text-sm font-medium text-violet-400 transition hover:text-violet-300"
                        >
                          Open peer →
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </section>
      </div>

      <NewPeerModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={handlePeerCreated}
      />
    </main>
  );
}
