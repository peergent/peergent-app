"use client";

import { useCallback, useEffect, useState } from "react";
import { defaultContextEngine } from "@/lib/context-engine";
import type { ContextBundle } from "@/lib/context-engine";

const PLACEHOLDER_REQUEST = {
  organizationId: "org_dev_placeholder",
  peerId: "peer_dev_placeholder",
  userId: "user_dev_placeholder",
  taskHint: "Context Engine playground smoke test",
} as const;

export default function ContextPlayground() {
  const [bundle, setBundle] = useState<ContextBundle | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [lazyLoading, setLazyLoading] = useState(false);

  const runBuild = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await defaultContextEngine.build(PLACEHOLDER_REQUEST);
      setBundle(result);
    } catch (err) {
      setBundle(null);
      setError(err instanceof Error ? err.message : "Failed to build context.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void runBuild();
  }, [runBuild]);

  async function runLazyKnowledge() {
    if (!bundle) {
      return;
    }

    setLazyLoading(true);
    setError(null);

    try {
      const updated = await defaultContextEngine.buildLazy(bundle, "knowledge");
      setBundle(updated);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load knowledge layer."
      );
    } finally {
      setLazyLoading(false);
    }
  }

  const knowledgeLoaded = Boolean(bundle?.layers.knowledge);

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
          and lazy-load the knowledge layer on demand.
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => void runBuild()}
          disabled={loading || lazyLoading}
          className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Building..." : "Rebuild"}
        </button>

        <button
          type="button"
          onClick={() => void runLazyKnowledge()}
          disabled={loading || lazyLoading || !bundle}
          className="rounded-lg border border-violet-500/30 bg-violet-500/10 px-4 py-2 text-sm font-medium text-violet-100 transition hover:bg-violet-500/20 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {lazyLoading ? "Loading knowledge..." : 'buildLazy("knowledge")'}
        </button>

        {bundle ? (
          <span className="text-sm text-slate-400">
            Completeness: {bundle.meta.completeness}% · Pending lazy layers:{" "}
            {bundle.meta.pendingLazyLayers.join(", ") || "none"}
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

        {loading ? (
          <p className="px-4 py-6 text-sm text-slate-400">Running build()...</p>
        ) : bundle ? (
          <pre className="max-h-[70vh] overflow-auto p-4 text-xs leading-6 text-slate-200">
            {JSON.stringify(bundle, null, 2)}
          </pre>
        ) : (
          <p className="px-4 py-6 text-sm text-slate-400">
            No bundle available. Use Rebuild to try again.
          </p>
        )}
      </section>
    </div>
  );
}
