"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Shield } from "lucide-react";
import { buildMarketingResponsibilitiesViewModel } from "@/lib/peer-experience/marketing/view-models/build-marketing-responsibilities-view-model";
import { RESPONSIBILITY_CATALOG } from "@/lib/peer-experience/marketing/responsibilities/responsibility-catalog";
import type { MarketingPeerDomainInput } from "@/lib/peer-experience/marketing/view-models/marketing-peer-domain-input";
import type { MarketingResponsibility } from "@/lib/peer-experience/marketing/responsibilities/types";

export type ResponsibilitiesTabProps = {
  domainInput: MarketingPeerDomainInput;
  onToggleOwnership: (responsibilityId: string, enabled: boolean) => void;
  onApprovePlan?: (responsibilityId: string) => void | Promise<void>;
  approvingId?: string | null;
};

export default function ResponsibilitiesTab({
  domainInput,
  onToggleOwnership,
  onApprovePlan,
  approvingId,
}: ResponsibilitiesTabProps) {
  const vm = useMemo(
    () => buildMarketingResponsibilitiesViewModel(domainInput),
    [domainInput]
  );
  const [busyId, setBusyId] = useState<string | null>(null);

  const owned = vm.cards.filter((c) => c.enabled);
  const notOwned = vm.cards.filter((c) => !c.enabled);

  const catalogNotConfigured = useMemo(() => {
    const configured = new Set(domainInput.responsibilities.map((r) => r.category));
    return RESPONSIBILITY_CATALOG.filter((e) => !configured.has(e.category));
  }, [domainInput.responsibilities]);

  return (
    <>
      <section className="mw-section" style={{ animationDelay: "0.05s" }}>
        <div className="mw-section-head">
          <div className="mw-section-title">
            <Shield size={15} aria-hidden />
            What {domainInput.peerName} owns
          </div>
          {vm.enabledCount > 0 && <span className="mw-count-badge">{vm.enabledCount}</span>}
        </div>
        <p className="mw-kn-helper" style={{ marginBottom: 14 }}>
          {vm.introMessage}
        </p>
        {owned.length === 0 ? (
          <p className="mw-empty-inline">{vm.emptyMessage}</p>
        ) : (
          <div className="mw-resp-list">
            {owned.map((card) => (
              <ResponsibilityRow
                key={card.id}
                card={card}
                peerName={domainInput.peerName}
                busy={busyId === card.id || approvingId === card.id}
                onToggle={() => {
                  setBusyId(card.id);
                  onToggleOwnership(card.id, false);
                  setTimeout(() => setBusyId(null), 300);
                }}
                onApprovePlan={
                  card.canApprovePlan && onApprovePlan
                    ? () => void onApprovePlan(card.id)
                    : undefined
                }
              />
            ))}
          </div>
        )}
      </section>

      <section className="mw-section" style={{ animationDelay: "0.1s", marginBottom: 0 }}>
        <div className="mw-section-head">
          <div className="mw-section-title">Not owned</div>
        </div>
        {notOwned.length === 0 && catalogNotConfigured.length === 0 ? (
          <p className="mw-empty-inline">
            {domainInput.peerName} is responsible for everything in your catalog.
          </p>
        ) : (
          <div className="mw-resp-list">
            {notOwned.map((card) => (
              <ResponsibilityRow
                key={card.id}
                card={card}
                peerName={domainInput.peerName}
                muted
                busy={busyId === card.id}
                onToggle={() => {
                  setBusyId(card.id);
                  onToggleOwnership(card.id, true);
                  setTimeout(() => setBusyId(null), 300);
                }}
              />
            ))}
          </div>
        )}
        {notOwned.length === 0 && catalogNotConfigured.length > 0 && (
          <p className="mw-empty-inline" style={{ marginTop: 12 }}>
            Additional capabilities can be added from peer settings.
          </p>
        )}
      </section>
    </>
  );
}

type RowProps = {
  card: ReturnType<typeof buildMarketingResponsibilitiesViewModel>["cards"][number];
  peerName: string;
  muted?: boolean;
  busy?: boolean;
  onToggle: () => void;
  onApprovePlan?: () => void;
};

function ResponsibilityRow({
  card,
  peerName,
  muted,
  busy,
  onToggle,
  onApprovePlan,
}: RowProps) {
  return (
    <div className={`mw-glass mw-resp-row${muted ? " mw-resp-row--muted" : ""}`}>
      <div className="mw-resp-main">
        <div className="mw-resp-title-row">
          <Link href={card.href} className="mw-resp-title pg-focus-premium">
            {card.title}
          </Link>
          <label className="mw-toggle">
            <input
              type="checkbox"
              checked={card.enabled}
              disabled={busy}
              onChange={onToggle}
              aria-label={`${card.enabled ? "Remove" : "Assign"} ${card.title} ownership`}
            />
            <span className="mw-toggle-ui" aria-hidden />
          </label>
        </div>
        <p className="mw-resp-scope">{card.goal}</p>
        <div className="mw-resp-meta">
          <span>{card.autonomyLabel} autonomy</span>
          <span>·</span>
          <span>{card.activeProjectCount} active projects</span>
          <span>·</span>
          <span>{card.healthLabel}</span>
        </div>
        {card.planningMessage && (
          <p className="mw-resp-plan">{peerName}: {card.planningMessage}</p>
        )}
      </div>
      <div className="mw-resp-actions">
        {onApprovePlan && (
          <button
            type="button"
            className="mw-btn-approve pg-focus-premium"
            disabled={busy}
            onClick={onApprovePlan}
          >
            Approve plan
          </button>
        )}
        <Link href={card.href} className="mw-btn-review pg-focus-premium">
          Details
        </Link>
      </div>
    </div>
  );
}

export function toggleResponsibilityEnabled(
  responsibilities: MarketingResponsibility[],
  responsibilityId: string,
  enabled: boolean
): MarketingResponsibility[] {
  const now = new Date().toISOString();
  return responsibilities.map((r) =>
    r.id === responsibilityId
      ? {
          ...r,
          enabled,
          status: enabled ? "enabled" : "disabled",
          updatedAt: now,
        }
      : r
  );
}
