"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import EditPeerModal from "@/components/peer-detail/EditPeerModal";
import PeerDetailSection from "@/components/peer-detail/PeerDetailSection";
import PeerDetailSkeleton from "@/components/peer-detail/PeerDetailSkeleton";
import {
  DEMO_APPROVALS,
  DEMO_CONVERSATIONS,
  DEMO_KNOWLEDGE,
  DEMO_SETTINGS,
  DEMO_TOOLS,
  getDemoActivity,
  getDemoInstructions,
} from "@/lib/peer-detail-demo";
import { getRoleConfig, type PeerRow } from "@/lib/peer-display";
import { supabase } from "@/lib/supabase";
import {
  ArrowLeft,
  Bot,
  ExternalLink,
  Globe2,
  Pencil,
  Plug,
  RefreshCw,
} from "lucide-react";

type PageState = "loading" | "success" | "error" | "not-found";

function formatWebsiteUrl(website: string) {
  if (/^https?:\/\//i.test(website)) {
    return website;
  }

  return `https://${website}`;
}

export default function PeerDetailPage() {
  const params = useParams<{ id: string }>();
  const peerId = params.id;

  const [peer, setPeer] = useState<PeerRow | null>(null);
  const [pageState, setPageState] = useState<PageState>("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [editModalOpen, setEditModalOpen] = useState(false);

  const fetchPeer = useCallback(async () => {
    if (!peerId) {
      setPageState("not-found");
      return;
    }

    setErrorMessage("");

    const { data, error } = await supabase
      .from("peers")
      .select("*")
      .eq("id", peerId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        setPeer(null);
        setPageState("not-found");
        return;
      }

      console.error("Supabase fetch error:", error);
      setErrorMessage(error.message || "Failed to load AI Peer.");
      setPageState("error");
      return;
    }

    setPeer(data as PeerRow);
    setPageState("success");
  }, [peerId]);

  useEffect(() => {
    let cancelled = false;

    async function loadPeer() {
      setPageState("loading");
      await fetchPeer();
      if (cancelled) {
        return;
      }
    }

    loadPeer();

    return () => {
      cancelled = true;
    };
  }, [fetchPeer]);

  const roleConfig = peer ? getRoleConfig(peer.role) : null;
  const Icon = roleConfig?.icon ?? Bot;
  const isActive = peer?.status === "active";

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#030712] via-[#081028] to-[#140b2e] text-white">
      <div className="mx-auto flex min-h-screen max-w-[1600px]">
        <Sidebar />

        <section className="min-w-0 flex-1 p-5 md:p-8">
          <Link
            href="/peers"
            className="inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-white"
          >
            <ArrowLeft size={16} />
            Back to AI Peers
          </Link>

          {pageState === "loading" && (
            <div className="mt-6">
              <PeerDetailSkeleton />
            </div>
          )}

          {pageState === "error" && (
            <div className="mt-8 rounded-2xl border border-red-500/20 bg-red-500/10 p-8 text-center">
              <h1 className="text-xl font-semibold text-red-200">
                Could not load AI Peer
              </h1>
              <p className="mt-3 text-sm text-red-300/90">{errorMessage}</p>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setPageState("loading");
                    fetchPeer();
                  }}
                  className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-sm font-medium transition hover:bg-violet-500"
                >
                  <RefreshCw size={16} />
                  Try again
                </button>
                <Link
                  href="/peers"
                  className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm text-slate-300 transition hover:bg-white/10"
                >
                  Back to AI Peers
                </Link>
              </div>
            </div>
          )}

          {pageState === "not-found" && (
            <div className="mt-8 rounded-2xl border border-white/10 bg-[#0b1120]/90 p-8 text-center">
              <h1 className="text-2xl font-semibold">Peer not found</h1>
              <p className="mt-3 text-sm text-slate-400">
                This AI Peer does not exist or may have been removed.
              </p>
              <Link
                href="/peers"
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-sm font-medium transition hover:bg-violet-500"
              >
                <ArrowLeft size={16} />
                Back to AI Peers
              </Link>
            </div>
          )}

          {pageState === "success" && peer && roleConfig && (
            <>
              <header className="mt-6 flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                <div className="flex gap-4">
                  <div
                    className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${roleConfig.gradient} shadow-lg`}
                  >
                    <Icon size={30} />
                  </div>

                  <div>
                    <p className="text-sm font-medium text-violet-400">
                      AI Peer control center
                    </p>

                    <h1 className="mt-1 text-3xl font-semibold tracking-tight md:text-4xl">
                      {peer.name}
                    </h1>

                    <p className="mt-2 text-sm text-violet-400">
                      {roleConfig.roleLabel}
                    </p>

                    <div className="mt-4 flex flex-wrap items-center gap-3">
                      {isActive ? (
                        <span className="flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
                          <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
                          Live
                        </span>
                      ) : (
                        <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-medium capitalize text-slate-400">
                          {peer.status}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setEditModalOpen(true)}
                  className="flex w-fit items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium text-slate-200 transition hover:bg-white/10"
                >
                  <Pencil size={16} />
                  Edit
                </button>
              </header>

              <div className="mt-8 grid gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
                <div className="space-y-5">
                  <PeerDetailSection
                    title="Current work"
                    description="What this peer is focused on right now."
                    demo
                    className="border-violet-500/20 bg-gradient-to-br from-[#0b1120]/95 to-violet-950/20"
                  >
                    <div className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.025] p-4">
                      <Bot size={18} className="mt-0.5 shrink-0 text-violet-400" />
                      <div>
                        <p className="text-xs uppercase tracking-wider text-slate-500">
                          Currently working
                        </p>
                        <p className="mt-2 text-sm leading-6 text-slate-200">
                          {roleConfig.workingStatus}
                        </p>
                      </div>
                    </div>
                  </PeerDetailSection>

                  <PeerDetailSection
                    title="Objective"
                    description="The mission this digital employee is responsible for."
                  >
                    <p className="text-sm leading-7 text-slate-300">
                      {peer.objective}
                    </p>
                  </PeerDetailSection>

                  <PeerDetailSection
                    title="Company website"
                    description="Primary company context used by this peer."
                  >
                    <a
                      href={formatWebsiteUrl(peer.website)}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-white/[0.025] p-4 transition hover:border-violet-500/30 hover:bg-white/[0.04]"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <Globe2 size={18} className="shrink-0 text-violet-400" />
                        <span className="truncate text-sm text-slate-200">
                          {peer.website}
                        </span>
                      </div>
                      <ExternalLink size={16} className="shrink-0 text-slate-500" />
                    </a>
                  </PeerDetailSection>

                  <PeerDetailSection
                    title="Performance summary"
                    description="High-level output metrics for this peer."
                    demo
                  >
                    <div className="grid gap-3 sm:grid-cols-3">
                      {roleConfig.stats.map((stat) => (
                        <div
                          key={stat.label}
                          className="rounded-xl bg-white/[0.035] p-4"
                        >
                          <p className="text-2xl font-semibold">{stat.value}</p>
                          <p className="mt-1 text-xs text-slate-500">
                            {stat.label}
                          </p>
                        </div>
                      ))}
                    </div>
                  </PeerDetailSection>

                  <PeerDetailSection
                    title="Recent activity"
                    description="Latest actions performed by this peer."
                    demo
                  >
                    <div className="space-y-5">
                      {getDemoActivity(peer.role).map((activity) => (
                        <div
                          key={`${activity.time}-${activity.action}`}
                          className="flex gap-4"
                        >
                          <span className="w-10 shrink-0 text-xs text-slate-500">
                            {activity.time}
                          </span>
                          <div className="relative border-l border-white/10 pl-4">
                            <span className="absolute -left-1 top-1.5 h-2 w-2 rounded-full bg-violet-500" />
                            <p className="text-sm text-slate-300">
                              {activity.action}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </PeerDetailSection>
                </div>

                <div className="space-y-5">
                  <PeerDetailSection
                    title="Knowledge"
                    description="Sources this peer can use to do its work."
                    demo
                  >
                    <div className="space-y-3">
                      {DEMO_KNOWLEDGE.map((source) => (
                        <div
                          key={source.name}
                          className="rounded-xl border border-white/10 bg-white/[0.025] p-4"
                        >
                          <p className="text-sm font-medium">{source.name}</p>
                          <div className="mt-2 flex items-center justify-between gap-3 text-xs text-slate-500">
                            <span>{source.type}</span>
                            <span>{source.updated}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </PeerDetailSection>

                  <PeerDetailSection
                    title="Instructions"
                    description="Operating rules for this digital employee."
                    demo
                  >
                    <ol className="space-y-3">
                      {getDemoInstructions(peer.role).map((instruction, index) => (
                        <li
                          key={instruction}
                          className="flex gap-3 text-sm leading-6 text-slate-300"
                        >
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-500/15 text-xs font-medium text-violet-300">
                            {index + 1}
                          </span>
                          <span>{instruction}</span>
                        </li>
                      ))}
                    </ol>
                  </PeerDetailSection>

                  <PeerDetailSection
                    title="Tools and integrations"
                    description="Systems connected to this peer."
                    demo
                  >
                    <div className="flex flex-wrap gap-2">
                      {DEMO_TOOLS.map((tool) => (
                        <span
                          key={tool.name}
                          className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs ${
                            tool.connected
                              ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
                              : "border-white/10 bg-white/[0.03] text-slate-400"
                          }`}
                        >
                          <Plug size={14} />
                          {tool.name}
                        </span>
                      ))}
                    </div>
                  </PeerDetailSection>
                </div>
              </div>

              <div className="mt-5 space-y-5">
                <PeerDetailSection
                  title="Conversations"
                  description="Recent interactions handled by this peer."
                  demo
                >
                  <div className="space-y-3">
                    {DEMO_CONVERSATIONS.map((conversation) => (
                      <div
                        key={`${conversation.contact}-${conversation.time}`}
                        className="rounded-xl border border-white/10 bg-white/[0.025] p-4"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-medium">
                              {conversation.contact}
                            </p>
                            <p className="mt-1 text-xs text-violet-400">
                              {conversation.channel}
                            </p>
                          </div>
                          <span className="text-xs text-slate-500">
                            {conversation.time}
                          </span>
                        </div>
                        <p className="mt-3 text-sm leading-6 text-slate-400">
                          {conversation.preview}
                        </p>
                      </div>
                    ))}
                  </div>
                </PeerDetailSection>

                <PeerDetailSection
                  title="Human approval queue"
                  description="Items waiting for a manager decision."
                  demo
                >
                  <div className="space-y-3">
                    {DEMO_APPROVALS.map((item) => (
                      <div
                        key={item.title}
                        className="rounded-xl border border-white/10 bg-white/[0.025] p-4"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-medium">{item.title}</p>
                            <p className="mt-2 text-sm leading-6 text-slate-400">
                              {item.description}
                            </p>
                          </div>
                          <span className="text-xs text-slate-500">
                            {item.requestedAt}
                          </span>
                        </div>
                        <div className="mt-4 flex gap-2">
                          <button
                            type="button"
                            disabled
                            className="rounded-xl bg-violet-600/50 px-4 py-2 text-xs font-medium text-white/70"
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            disabled
                            className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 text-xs text-slate-500"
                          >
                            Review
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </PeerDetailSection>

                <PeerDetailSection
                  title="Settings"
                  description="Peer-specific configuration for this digital employee."
                  demo
                >
                  <div className="space-y-3">
                    {DEMO_SETTINGS.map((setting) => (
                      <div
                        key={setting.label}
                        className="flex items-start justify-between gap-4 rounded-xl border border-white/10 bg-white/[0.025] p-4"
                      >
                        <div>
                          <p className="text-sm font-medium">{setting.label}</p>
                          <p className="mt-1 text-sm text-slate-400">
                            {setting.description}
                          </p>
                        </div>
                        <button
                          type="button"
                          disabled
                          aria-label={setting.label}
                          className={`relative h-6 w-11 shrink-0 rounded-full transition ${
                            setting.enabled ? "bg-violet-600/60" : "bg-white/10"
                          }`}
                        >
                          <span
                            className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition ${
                              setting.enabled ? "left-5" : "left-0.5"
                            }`}
                          />
                        </button>
                      </div>
                    ))}
                  </div>
                </PeerDetailSection>
              </div>

              <EditPeerModal
                open={editModalOpen}
                peer={peer}
                onClose={() => setEditModalOpen(false)}
                onSuccess={fetchPeer}
              />
            </>
          )}
        </section>
      </div>
    </main>
  );
}
