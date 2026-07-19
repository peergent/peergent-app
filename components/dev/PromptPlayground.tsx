"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAccount } from "@/components/account/AccountProvider";
import PromptPeerSelector from "@/components/dev/PromptPeerSelector";
import { defaultContextEngine } from "@/lib/context-engine";
import {
  displayWebsite,
  formatAnalyzedAt,
  resolveDefaultPeerId,
} from "@/lib/dev/prompt-playground-utils";
import {
  buildPrompt,
  formatPromptForCopy,
  type PromptPackage,
} from "@/lib/prompt-builder";
import type { ContextPackage } from "@/lib/intelligence";
import type { AIResponse } from "@/lib/ai-runtime";
import { requestAIResponse } from "@/lib/dev/request-ai-response";
import type { PeerRow } from "@/lib/peer-display";
import { fetchOrganizationPeers } from "@/lib/peers/queries";
import { fetchLatestWebsiteIntelligenceAssessment } from "@/lib/website-intelligence";
import { createClient } from "@/lib/supabase/client";

export default function PromptPlayground() {
  const { account, loading: accountLoading } = useAccount();
  const supabase = useMemo(() => createClient(), []);
  const [peers, setPeers] = useState<PeerRow[]>([]);
  const [peersLoading, setPeersLoading] = useState(false);
  const [lastAnalyzedAt, setLastAnalyzedAt] = useState<string | null>(null);
  const [assessmentWebsite, setAssessmentWebsite] = useState<string | null>(null);
  const [selectedPeerId, setSelectedPeerId] = useState<string>("");
  const [contextPackage, setContextPackage] = useState<ContextPackage | null>(null);
  const [prompt, setPrompt] = useState<PromptPackage | null>(null);
  const [aiResponse, setAiResponse] = useState<AIResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generatingAi, setGeneratingAi] = useState(false);
  const [copyMessage, setCopyMessage] = useState<string | null>(null);

  useEffect(() => {
    const organizationId = account?.organization?.id;
    if (!organizationId) {
      setPeers([]);
      setSelectedPeerId("");
      setLastAnalyzedAt(null);
      setAssessmentWebsite(null);
      return;
    }

    const orgId = organizationId;

    let cancelled = false;

    async function loadPeerContext() {
      setPeersLoading(true);
      setError(null);

      try {
        const [nextPeers, latestAssessment] = await Promise.all([
          fetchOrganizationPeers(supabase, orgId),
          fetchLatestWebsiteIntelligenceAssessment(supabase, orgId).catch(() => null),
        ]);

        if (cancelled) {
          return;
        }

        setPeers(nextPeers);
        setLastAnalyzedAt(latestAssessment?.analyzedAt ?? null);
        setAssessmentWebsite(latestAssessment?.assessment.meta.url ?? null);
        setSelectedPeerId((current) => {
          if (current && nextPeers.some((peer) => peer.id === current)) {
            return current;
          }

          return resolveDefaultPeerId(
            nextPeers,
            latestAssessment?.assessment.meta.url
          );
        });
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load peers.");
        }
      } finally {
        if (!cancelled) {
          setPeersLoading(false);
        }
      }
    }

    void loadPeerContext();

    return () => {
      cancelled = true;
    };
  }, [account?.organization?.id, supabase]);

  const buildContextPackage = useCallback(async () => {
    if (!account?.organization || !selectedPeerId) return null;

    setLoading(true);
    setError(null);
    setPrompt(null);
    setAiResponse(null);

    try {
      const result = await defaultContextEngine.buildContext(
        {
          organizationId: account.organization.id,
          peerId: selectedPeerId,
          userId: account.userId,
          membershipRole: account.organization.role,
          taskHint: "Prompt Builder playground task",
        },
        { supabase }
      );

      setContextPackage(result);
      return result;
    } catch (err) {
      setContextPackage(null);
      setError(err instanceof Error ? err.message : "Failed to build context.");
      return null;
    } finally {
      setLoading(false);
    }
  }, [account, selectedPeerId, supabase]);

  const generatePrompt = useCallback(async () => {
    setGenerating(true);
    setError(null);

    try {
      const nextPackage = contextPackage ?? (await buildContextPackage());
      if (!nextPackage) return;
      setPrompt(
        buildPrompt(nextPackage, {
          taskHint: "Prompt Builder playground task",
        })
      );
      setAiResponse(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate prompt.");
    } finally {
      setGenerating(false);
    }
  }, [buildContextPackage, contextPackage]);

  const generateAiResponse = useCallback(async () => {
    setGeneratingAi(true);
    setError(null);
    setCopyMessage(null);

    try {
      let nextPrompt = prompt;

      if (!nextPrompt) {
        const nextPackage = contextPackage ?? (await buildContextPackage());
        if (!nextPackage) return;
        nextPrompt = buildPrompt(nextPackage, {
          taskHint: "Prompt Builder playground task",
        });
        setPrompt(nextPrompt);
      }

      const response = await requestAIResponse(nextPrompt);
      setAiResponse(response);
    } catch (err) {
      setAiResponse(null);
      setError(err instanceof Error ? err.message : "Failed to generate AI response.");
    } finally {
      setGeneratingAi(false);
    }
  }, [buildContextPackage, contextPackage, prompt]);

  async function handleCopyPrompt() {
    if (!prompt) return;

    try {
      await navigator.clipboard.writeText(formatPromptForCopy(prompt));
      setCopyMessage("Prompt copied to clipboard.");
    } catch {
      setCopyMessage("Unable to copy prompt.");
    }
  }

  async function handleCopyAiResponse() {
    if (!aiResponse?.text) return;

    try {
      await navigator.clipboard.writeText(aiResponse.text);
      setCopyMessage("AI response copied to clipboard.");
    } catch {
      setCopyMessage("Unable to copy AI response.");
    }
  }

  function handleSelectPeer(peerId: string) {
    setSelectedPeerId(peerId);
    setContextPackage(null);
    setPrompt(null);
    setAiResponse(null);
  }

  const selectedPeer = peers.find((peer) => peer.id === selectedPeerId);

  if (accountLoading) {
    return <p className="text-sm text-slate-400">Loading authenticated session...</p>;
  }

  if (!account) {
    return (
      <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
        Sign in to use the Prompt Builder playground.
      </div>
    );
  }

  if (!account.organization) {
    return (
      <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
        No active organization found for this account.
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <header className="flex flex-col gap-2 border-b border-white/10 pb-6">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-violet-300/80">
          Developer Playground
        </p>
        <h1 className="text-2xl font-semibold text-white">Prompt Builder</h1>
        <p className="max-w-2xl text-sm text-slate-400">
          Build a Context Package via buildContext(), generate a role-aware PromptPackage
          with buildPrompt(), and request an AI Peer response.
        </p>
      </header>

      <section className="grid gap-4 rounded-xl border border-white/10 bg-[#070b18] p-4 md:grid-cols-2">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">Organization</p>
          <p className="mt-1 text-sm text-white">{account.organization.name}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">Website</p>
          <p className="mt-1 text-sm text-white">
            {selectedPeer
              ? displayWebsite(selectedPeer.website)
              : assessmentWebsite
                ? displayWebsite(assessmentWebsite)
                : "No website selected"}
          </p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">Peer</p>
          <p className="mt-1 text-sm text-white">
            {selectedPeer?.name ?? "Select a peer below"}
          </p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">Role</p>
          <p className="mt-1 text-sm text-white">{selectedPeer?.role ?? "—"}</p>
        </div>
        <div className="md:col-span-2">
          <p className="text-xs uppercase tracking-wide text-slate-500">Last analyzed</p>
          <p className="mt-1 text-sm text-white">{formatAnalyzedAt(lastAnalyzedAt)}</p>
          {assessmentWebsite ? (
            <p className="mt-1 text-xs text-slate-500">
              Latest Website Intelligence: {displayWebsite(assessmentWebsite)}
            </p>
          ) : null}
        </div>

        <div className="md:col-span-2">
          {peersLoading ? (
            <p className="text-sm text-slate-400">Loading peers...</p>
          ) : (
            <PromptPeerSelector
              peers={peers}
              selectedPeerId={selectedPeerId}
              onSelectPeer={handleSelectPeer}
              disabled={loading || generating || generatingAi}
            />
          )}
        </div>
      </section>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => void buildContextPackage()}
          disabled={loading || generating || generatingAi || !selectedPeerId}
          className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Building context..." : "buildContext()"}
        </button>
        <button
          type="button"
          onClick={() => void generatePrompt()}
          disabled={loading || generating || generatingAi || !selectedPeerId}
          className="rounded-lg border border-violet-500/30 bg-violet-500/10 px-4 py-2 text-sm font-medium text-violet-100 transition hover:bg-violet-500/20 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {generating ? "Generating..." : "Generate PromptPackage"}
        </button>
        <button
          type="button"
          onClick={() => void generateAiResponse()}
          disabled={loading || generating || generatingAi || !selectedPeerId}
          className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-100 transition hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {generatingAi ? "Generating AI response..." : "Generate AI Response"}
        </button>
        <button
          type="button"
          onClick={() => void handleCopyPrompt()}
          disabled={!prompt}
          className="rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-sm font-medium text-cyan-100 transition hover:bg-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Copy Prompt
        </button>
        <button
          type="button"
          onClick={() => void handleCopyAiResponse()}
          disabled={!aiResponse?.text}
          className="rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-sm font-medium text-cyan-100 transition hover:bg-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Copy AI Response
        </button>
        {copyMessage ? <span className="text-sm text-slate-400">{copyMessage}</span> : null}
      </div>

      {error ? (
        <div role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
          {error}
        </div>
      ) : null}

      {prompt ? (
        <div className="grid gap-4">
          <section className="rounded-xl border border-white/10 bg-[#070b18] p-4">
            <h2 className="text-sm font-medium text-slate-200">systemPrompt</h2>
            <pre className="mt-3 whitespace-pre-wrap text-xs leading-6 text-slate-300">
              {prompt.systemPrompt}
            </pre>
          </section>

          <section className="rounded-xl border border-white/10 bg-[#070b18] p-4">
            <h2 className="text-sm font-medium text-slate-200">taskPrompt</h2>
            <pre className="mt-3 whitespace-pre-wrap text-xs leading-6 text-slate-300">
              {prompt.taskPrompt}
            </pre>
          </section>

          <section className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-white/10 bg-[#070b18] p-4">
              <h2 className="text-sm font-medium text-slate-200">Included layers</h2>
              <p className="mt-2 text-sm text-slate-400">
                {prompt.includedLayers.join(", ") || "none"}
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-[#070b18] p-4">
              <h2 className="text-sm font-medium text-slate-200">Excluded layers</h2>
              <p className="mt-2 text-sm text-slate-400">
                {prompt.excludedLayers.join(", ") || "none"}
              </p>
            </div>
          </section>

          <section className="rounded-xl border border-white/10 bg-[#070b18] p-4">
            <h2 className="text-sm font-medium text-slate-200">Warnings</h2>
            {prompt.warnings.length > 0 ? (
              <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-amber-100">
                {prompt.warnings.map((warning) => (
                  <li key={warning}>{warning}</li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-slate-400">No warnings.</p>
            )}
          </section>

          <section className="rounded-xl border border-white/10 bg-[#070b18] p-4">
            <h2 className="text-sm font-medium text-slate-200">Metadata</h2>
            <pre className="mt-3 overflow-auto text-xs leading-6 text-slate-300">
              {JSON.stringify(prompt.metadata, null, 2)}
            </pre>
          </section>

          {aiResponse ? (
            <>
              <section className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                <h2 className="text-sm font-medium text-emerald-100">AI response</h2>
                <pre className="mt-3 whitespace-pre-wrap text-xs leading-6 text-slate-200">
                  {aiResponse.text}
                </pre>
              </section>

              <section className="grid gap-4 md:grid-cols-2">
                <div className="rounded-xl border border-white/10 bg-[#070b18] p-4">
                  <h2 className="text-sm font-medium text-slate-200">Model</h2>
                  <p className="mt-2 text-sm text-slate-400">{aiResponse.metadata.model}</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-[#070b18] p-4">
                  <h2 className="text-sm font-medium text-slate-200">Latency</h2>
                  <p className="mt-2 text-sm text-slate-400">
                    {aiResponse.metadata.latencyMs} ms
                  </p>
                </div>
                <div className="rounded-xl border border-white/10 bg-[#070b18] p-4">
                  <h2 className="text-sm font-medium text-slate-200">Token usage</h2>
                  <p className="mt-2 text-sm text-slate-400">
                    input {aiResponse.metadata.usage.inputTokens ?? 0} · output{" "}
                    {aiResponse.metadata.usage.outputTokens ?? 0} · total{" "}
                    {aiResponse.metadata.usage.totalTokens ?? 0}
                  </p>
                </div>
                <div className="rounded-xl border border-white/10 bg-[#070b18] p-4">
                  <h2 className="text-sm font-medium text-slate-200">Finish reason</h2>
                  <p className="mt-2 text-sm text-slate-400">
                    {aiResponse.metadata.finishReason}
                  </p>
                </div>
              </section>

              <section className="rounded-xl border border-white/10 bg-[#070b18] p-4">
                <h2 className="text-sm font-medium text-slate-200">Validation warnings</h2>
                {aiResponse.validated.warnings.length > 0 ? (
                  <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-amber-100">
                    {aiResponse.validated.warnings.map((warning) => (
                      <li key={warning}>{warning}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-sm text-slate-400">No validation warnings.</p>
                )}
              </section>
            </>
          ) : null}
        </div>
      ) : (
        <p className="text-sm text-slate-400">
          Build context and generate a PromptPackage to inspect the output.
        </p>
      )}
    </div>
  );
}
