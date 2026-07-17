"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useAccount } from "@/components/account/AccountProvider";
import Sidebar from "@/components/Sidebar";
import PeerDetailSection from "@/components/peer-detail/PeerDetailSection";
import ConnectedSourceCard from "@/components/knowledge/ConnectedSourceCard";
import DocumentUploadArea from "@/components/knowledge/DocumentUploadArea";
import {
  CONNECTED_SOURCES,
  DEMO_DOCUMENTS,
  getKnowledgeStats,
} from "@/lib/knowledge-demo";
import { fetchOrganizationPeers } from "@/lib/peers/queries";
import { createClient } from "@/lib/supabase/client";
import {
  ArrowRight,
  BookOpen,
  ExternalLink,
  FileText,
  Globe2,
  ScanSearch,
} from "lucide-react";

function formatWebsiteUrl(website: string) {
  if (/^https?:\/\//i.test(website)) {
    return website;
  }

  return `https://${website}`;
}

export default function KnowledgePage() {
  const { organizationId } = useAccount();
  const [companyWebsites, setCompanyWebsites] = useState<string[]>([]);
  const [loadingWebsites, setLoadingWebsites] = useState(true);

  const fetchCompanyWebsites = useCallback(async () => {
    setLoadingWebsites(true);

    try {
      const supabase = createClient();
      const peers = await fetchOrganizationPeers(supabase, organizationId);
      const uniqueWebsites = [
        ...new Set(
          peers
            .map((peer) => peer.website?.trim())
            .filter((website): website is string => Boolean(website))
        ),
      ];
      setCompanyWebsites(uniqueWebsites);
    } catch (error) {
      console.error("Supabase fetch error:", error);
      setCompanyWebsites([]);
    } finally {
      setLoadingWebsites(false);
    }
  }, [organizationId]);

  useEffect(() => {
    fetchCompanyWebsites();
  }, [fetchCompanyWebsites]);

  const primaryWebsite = companyWebsites[0] ?? null;
  const connectedSourceCount = CONNECTED_SOURCES.filter(
    (source) => source.status === "connected"
  ).length;

  const stats = getKnowledgeStats({
    documentCount: DEMO_DOCUMENTS.length,
    connectedSourceCount,
    hasWebsite: Boolean(primaryWebsite),
  });

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#030712] via-[#081028] to-[#140b2e] text-white">
      <div className="mx-auto flex min-h-screen max-w-[1600px]">
        <Sidebar />

        <section className="min-w-0 flex-1 p-5 md:p-8">
          <header className="mb-8">
            <p className="text-sm font-medium text-violet-400">Knowledge</p>

            <h1 className="mt-1 text-3xl font-semibold tracking-tight md:text-4xl">
              Knowledge
            </h1>

            <p className="mt-2 max-w-3xl text-slate-400">
              Train your AI workforce with company knowledge.
            </p>
          </header>

          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <article className="rounded-2xl border border-white/10 bg-[#0b1120]/90 p-5 shadow-xl shadow-black/10 backdrop-blur">
              <p className="text-sm text-slate-400">Documents</p>
              <p className="mt-3 text-3xl font-semibold">{stats.documents}</p>
              <p className="mt-2 text-sm text-violet-400">Demo library</p>
            </article>

            <article className="rounded-2xl border border-white/10 bg-[#0b1120]/90 p-5 shadow-xl shadow-black/10 backdrop-blur">
              <p className="text-sm text-slate-400">Sources</p>
              <p className="mt-3 text-3xl font-semibold">{stats.sources}</p>
              <p className="mt-2 text-sm text-emerald-400">Active connections</p>
            </article>

            <article className="rounded-2xl border border-white/10 bg-[#0b1120]/90 p-5 shadow-xl shadow-black/10 backdrop-blur">
              <p className="text-sm text-slate-400">Last sync</p>
              <p className="mt-3 text-3xl font-semibold">{stats.lastSync}</p>
              <p className="mt-2 text-sm text-slate-500">Knowledge freshness</p>
            </article>

            <article className="rounded-2xl border border-white/10 bg-[#0b1120]/90 p-5 shadow-xl shadow-black/10 backdrop-blur">
              <p className="text-sm text-slate-400">Index status</p>
              <p className="mt-3 text-3xl font-semibold">{stats.indexStatus}</p>
              <p className="mt-2 text-sm text-blue-400">Search readiness</p>
            </article>
          </section>

          <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
            <div className="space-y-6">
              <PeerDetailSection
                title="Uploaded documents"
                description="Files your AI peers can learn from."
                demo
              >
                <DocumentUploadArea />

                <div className="mt-6 space-y-3">
                  {DEMO_DOCUMENTS.map((document) => (
                    <div
                      key={document.id}
                      className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-white/[0.025] p-4"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/15">
                          <FileText size={18} className="text-violet-400" />
                        </div>

                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">
                            {document.name}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {document.type} · {document.size} ·{" "}
                            {document.uploadedAt}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </PeerDetailSection>

              <PeerDetailSection
                title="Connected sources"
                description="Integrations that feed knowledge into Peergent."
                demo
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  {CONNECTED_SOURCES.map((source) => (
                    <ConnectedSourceCard key={source.id} source={source} />
                  ))}
                </div>
              </PeerDetailSection>
            </div>

            <div className="space-y-6">
              <PeerDetailSection
                title="Company website"
                description="Your primary digital knowledge source."
              >
                {loadingWebsites ? (
                  <div className="animate-pulse space-y-3">
                    <div className="h-24 rounded-xl bg-white/10" />
                  </div>
                ) : primaryWebsite ? (
                  <div className="space-y-4">
                    <a
                      href={formatWebsiteUrl(primaryWebsite)}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-between gap-4 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.04] p-4 transition hover:border-emerald-500/30"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15">
                          <Globe2 size={20} className="text-emerald-400" />
                        </div>

                        <div className="min-w-0">
                          <p className="text-xs uppercase tracking-wider text-slate-500">
                            Primary website
                          </p>
                          <p className="mt-1 truncate text-sm font-medium text-white">
                            {primaryWebsite}
                          </p>
                          <p className="mt-1 text-xs text-emerald-400">
                            Synced from your AI peers
                          </p>
                        </div>
                      </div>

                      <ExternalLink size={16} className="shrink-0 text-slate-500" />
                    </a>

                    {companyWebsites.length > 1 && (
                      <div className="space-y-2">
                        <p className="text-xs uppercase tracking-wider text-slate-500">
                          Additional websites
                        </p>
                        {companyWebsites.slice(1).map((website) => (
                          <div
                            key={website}
                            className="rounded-xl border border-white/10 bg-white/[0.025] px-4 py-3 text-sm text-slate-300"
                          >
                            {website}
                          </div>
                        ))}
                      </div>
                    )}

                    <Link
                      href="/website-intelligence"
                      className="inline-flex items-center gap-2 text-sm font-medium text-violet-400 transition hover:text-violet-300"
                    >
                      Re-analyze website
                      <ArrowRight size={16} />
                    </Link>
                  </div>
                ) : (
                  <div className="flex flex-col items-center rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-6 py-10 text-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-500/15">
                      <Globe2 size={28} className="text-violet-400" />
                    </div>

                    <h3 className="mt-5 text-lg font-semibold">
                      No company website yet
                    </h3>

                    <p className="mt-2 max-w-sm text-sm leading-6 text-slate-400">
                      Analyze a website with Website Intelligence or create an
                      AI Peer to connect your company knowledge.
                    </p>

                    <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                      <Link
                        href="/website-intelligence"
                        className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-sm font-medium shadow-lg shadow-violet-950/40 transition hover:bg-violet-500"
                      >
                        <ScanSearch size={16} />
                        Analyze website
                      </Link>

                      <Link
                        href="/peers"
                        className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm text-slate-300 transition hover:bg-white/10"
                      >
                        Create AI Peer
                      </Link>
                    </div>
                  </div>
                )}
              </PeerDetailSection>

              <PeerDetailSection
                title="Knowledge overview"
                description="How your AI workforce uses this library."
                demo
              >
                <div className="space-y-4">
                  <div className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.025] p-4">
                    <BookOpen size={18} className="mt-0.5 shrink-0 text-violet-400" />
                    <p className="text-sm leading-6 text-slate-400">
                      AI peers draw from connected websites and uploaded
                      documents when answering customers, qualifying leads, and
                      supporting your team.
                    </p>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-white/[0.025] p-4 text-sm text-slate-400">
                    Vector search, embeddings, and live AI indexing are coming
                    soon. This page is your knowledge management hub.
                  </div>
                </div>
              </PeerDetailSection>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
