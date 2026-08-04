"use client";

import { useState } from "react";
import type { StrategyRunTraceStage } from "@/lib/office/campaign/strategy-run-trace";

export type CampaignStrategyDevDiagnosticsProps = {
  runId?: string;
  lastStatus?: string;
  provider?: string;
  failureCode?: string;
  fallbackUsed?: boolean;
  traceLastStage?: StrategyRunTraceStage | string;
  locale?: string | null;
  triggerKey?: string;
  actionInvocationCount?: number;
  actionDurationMs?: number;
  inFlightReused?: boolean;
  terminalState?: string;
  model?: string;
  inputTokens?: number;
  outputTokens?: number;
};

export function isDevDiagnosticsVisible(): boolean {
  return process.env.NODE_ENV !== "production";
}

function traceStageLabel(stage: string | undefined, nl: boolean): string {
  if (!stage) return "—";
  const map: Record<string, { en: string; nl: string }> = {
    client_request_pending: {
      en: "Client request pending",
      nl: "Client wacht op server",
    },
    server_action_entered: {
      en: "Server action entered",
      nl: "Serveractie gestart",
    },
    server_provider_selected: {
      en: "Provider request active",
      nl: "Provider actief",
    },
    server_openai_request_completed: {
      en: "OpenAI request completed",
      nl: "OpenAI-verzoek voltooid",
    },
    server_action_timeout: {
      en: "Server action timeout",
      nl: "Serveractie timeout",
    },
    server_serialization_error: {
      en: "Serialization error",
      nl: "Serialisatiefout",
    },
    client_request_timeout: {
      en: "Client request timeout",
      nl: "Client timeout",
    },
    client_reconciliation_error: {
      en: "Client reconciliation error",
      nl: "Client reconciliatiefout",
    },
    client_stale_optimistic_recovered: {
      en: "Stale optimistic state recovered",
      nl: "Verouderde optimistische status hersteld",
    },
  };
  return map[stage]?.[nl ? "nl" : "en"] ?? stage;
}

export default function CampaignStrategyDevDiagnostics({
  runId,
  lastStatus,
  provider,
  failureCode,
  fallbackUsed,
  traceLastStage,
  locale,
  triggerKey,
  actionInvocationCount,
  actionDurationMs,
  inFlightReused,
  terminalState,
  model,
  inputTokens,
  outputTokens,
}: CampaignStrategyDevDiagnosticsProps) {
  const nl = locale === "nl";
  const [open, setOpen] = useState(false);

  if (!isDevDiagnosticsVisible()) return null;

  return (
    <div className="mt-3" data-testid="campaign-strategy-dev-diagnostics">
      <button
        type="button"
        className="pg-v13-mono text-[10px] font-semibold uppercase tracking-wide text-[var(--pg-v13-ink-faint)] underline-offset-2 hover:underline"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        {nl ? "Developerdiagnostiek" : "Developer diagnostics"}
        {open ? " ▴" : " ▾"}
      </button>
      {open ? (
        <div className="mt-2 rounded-[var(--pg-radius-sm)] border border-dashed border-[var(--pg-v13-line-soft)] bg-[var(--pg-v13-panel)] p-3">
          <dl className="pg-v13-mono m-0 grid gap-1 text-[10px] text-[var(--pg-v13-ink-soft)]">
            <div className="flex gap-2">
              <dt className="min-w-[72px] text-[var(--pg-v13-ink-faint)]">run</dt>
              <dd className="m-0">{runId ?? "—"}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="min-w-[72px] text-[var(--pg-v13-ink-faint)]">status</dt>
              <dd className="m-0">{lastStatus ?? "—"}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="min-w-[72px] text-[var(--pg-v13-ink-faint)]">provider</dt>
              <dd className="m-0">{provider ?? "—"}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="min-w-[72px] text-[var(--pg-v13-ink-faint)]">code</dt>
              <dd className="m-0">{failureCode ?? "—"}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="min-w-[72px] text-[var(--pg-v13-ink-faint)]">trace</dt>
              <dd className="m-0">{traceStageLabel(traceLastStage, nl)}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="min-w-[72px] text-[var(--pg-v13-ink-faint)]">fallback</dt>
              <dd className="m-0">{String(fallbackUsed ?? false)}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="min-w-[72px] text-[var(--pg-v13-ink-faint)]">trigger</dt>
              <dd className="m-0 break-all">{triggerKey ?? "—"}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="min-w-[72px] text-[var(--pg-v13-ink-faint)]">invokes</dt>
              <dd className="m-0">{actionInvocationCount ?? "—"}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="min-w-[72px] text-[var(--pg-v13-ink-faint)]">action ms</dt>
              <dd className="m-0">{actionDurationMs ?? "—"}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="min-w-[72px] text-[var(--pg-v13-ink-faint)]">inflight</dt>
              <dd className="m-0">{inFlightReused === undefined ? "—" : String(inFlightReused)}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="min-w-[72px] text-[var(--pg-v13-ink-faint)]">terminal</dt>
              <dd className="m-0">{terminalState ?? "—"}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="min-w-[72px] text-[var(--pg-v13-ink-faint)]">model</dt>
              <dd className="m-0">{model ?? "—"}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="min-w-[72px] text-[var(--pg-v13-ink-faint)]">tokens</dt>
              <dd className="m-0">
                {inputTokens !== undefined || outputTokens !== undefined
                  ? `${inputTokens ?? "—"} / ${outputTokens ?? "—"}`
                  : "—"}
              </dd>
            </div>
          </dl>
        </div>
      ) : null}
    </div>
  );
}
