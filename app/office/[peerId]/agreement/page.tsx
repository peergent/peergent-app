"use client";

import { Suspense, useMemo, useState } from "react";
import { PgOfficeShell, PgSkeletonRows } from "@/components/design-system";
import AgreementView from "@/features/office/agreement/AgreementView";
import { useOfficePeer } from "@/features/office/useOfficePeer";
import { buildMarketingAgreementViewModel } from "@/lib/office/agreement/build-marketing-agreement";
import { buildMarketingDeskViewModel } from "@/lib/office/desk/build-marketing-desk";
import {
  isDemoWorkspaceModified,
  resetDemoWorkspace,
  setDemoResponsibilities,
} from "@/lib/office/demo/demo-workspace-state";
import type {
  AgreementSaveState,
  BoundaryKind,
} from "@/lib/office/agreement/types";

/**
 * §4.8 Working agreement.
 *
 * Saves go through the existing `updateResponsibilities` workspace mutation —
 * the canonical autonomy write path. Nothing new is invented here.
 */


/**
 * Demo boundaries behave exactly like real ones — same confirmation, same
 * consequence, same reversal — but nothing is stored. Saying so once, next to
 * the controls, is what keeps the interaction honest rather than misleading.
 */
function DemoAgreementNotice({ locale }: { locale?: string | null }) {
  const nl = locale === "nl";
  const modified = isDemoWorkspaceModified();

  return (
    <div
      className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-[var(--pg-radius-sm)] border border-dashed border-[var(--pg-office-line-strong)] px-4 py-3"
      data-testid="demo-agreement-notice"
    >
      <p className="min-w-0 flex-1 text-[12.5px] leading-snug text-[var(--pg-color-text-secondary)]">
        {nl
          ? "Demo-werkruimte. Je kunt grenzen hier gerust verzetten — het werkt precies zoals in het echt, maar er wordt niets opgeslagen."
          : "Demo workspace. Move a boundary and it behaves exactly as it would for real — nothing is saved."}
      </p>
      {modified ? (
        <button
          type="button"
          onClick={resetDemoWorkspace}
          className="pg-focus-premium shrink-0 text-[12.5px] text-[var(--pg-color-accent)]"
          data-testid="demo-reset"
        >
          {nl ? "Zet de demo terug" : "Reset the demo"}
        </button>
      ) : null}
    </div>
  );
}

function OfficeAgreementInner() {
  const {
    peerId,
    peerName,
    peerRole,
    domainInput,
    localePreference,
    loading,
    isDemo,
    team,
    workspace,
  } = useOfficePeer();

  const [saveState, setSaveState] = useState<AgreementSaveState>({ status: "idle" });
  const [pending, setPending] = useState<{ id: string; next: BoundaryKind } | null>(
    null
  );

  const model = useMemo(
    () =>
      buildMarketingAgreementViewModel({
        domainInput,
        peerName,
        peerRole,
        localePreference,
      }),
    [domainInput, peerName, peerRole, localePreference]
  );

  const deskModel = useMemo(
    () =>
      buildMarketingDeskViewModel({
        domainInput,
        peerName,
        peerRole,
        localePreference,
      }),
    [domainInput, peerName, peerRole, localePreference]
  );

  function requestChange(boundaryId: string, next: BoundaryKind) {
    const boundary = [
      ...model.autonomous,
      ...model.needsApproval,
      ...model.never,
    ].find((b) => b.id === boundaryId);
    if (!boundary) return;

    // The consequence of the *target* state, so nothing changes silently.
    const consequence =
      next === "autonomous"
        ? boundary.consequence.replace(/^I'll prepare|^Ik bereid/, "I'll carry out")
        : boundary.consequence;

    setPending({ id: boundaryId, next });
    setSaveState({ status: "confirming", boundaryId, consequence });
  }

  function confirmChange(boundaryId: string) {
    if (!pending || pending.id !== boundaryId) return;

    const current = domainInput.responsibilities.find((r) => r.id === boundaryId);
    if (!current) {
      setSaveState({
        status: "conflict",
        boundaryId,
        reason: "This boundary changed elsewhere. Reload and try again.",
      });
      return;
    }

    setSaveState({ status: "saving", boundaryId });

    const next = domainInput.responsibilities.map((responsibility) =>
      responsibility.id === boundaryId
        ? {
            ...responsibility,
            enabled: pending.next !== "never",
            status: pending.next === "never" ? ("disabled" as const) : ("enabled" as const),
            approvalPolicy:
              pending.next === "autonomous"
                ? ("fully_automatic" as const)
                : ("approval_required" as const),
            autonomyLevel:
              pending.next === "autonomous"
                ? ("autonomous" as const)
                : ("semi_autonomous" as const),
            updatedAt: new Date().toISOString(),
          }
        : responsibility
    );

    try {
      if (isDemo) {
        // The only line that differs between demo and live. The demo store has
        // no path to persistence, and rejects any peer id but its own.
        setDemoResponsibilities(peerId, next);
      } else {
        workspace.updateResponsibilities(next);
      }
      setSaveState({ status: "saved", boundaryId });
      setPending(null);
    } catch {
      setSaveState({
        status: "failed",
        boundaryId,
        voice: "I couldn't save that change — that was my side, not yours.",
        preserved: "Nothing changed: the boundary is still exactly as it was.",
      });
    }
  }

  return (
    <PgOfficeShell
      peerId={peerId}
      locale={localePreference}
      isDemo={isDemo}
      peerName={peerName}
      peerRole={peerRole}
      team={team}
      active="agreement"
      presence={loading ? null : model.presence}
      decisionCount={deskModel.decisions.length}
      onBrief={() => undefined}
      onSearch={() => undefined}
    >
      {loading ? (
        <PgSkeletonRows rows={3} rowHeight={156} />
      ) : (
        <>
          {isDemo ? <DemoAgreementNotice locale={localePreference} /> : null}
          <AgreementView
            model={model}
            saveState={saveState}
            onChangeBoundary={requestChange}
            onConfirm={confirmChange}
            onCancel={() => {
              setPending(null);
              setSaveState({ status: "idle" });
            }}
          />
        </>
      )}
    </PgOfficeShell>
  );
}

export default function OfficeAgreementPage() {
  return (
    <Suspense fallback={null}>
      <OfficeAgreementInner />
    </Suspense>
  );
}
