"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Settings2 } from "lucide-react";
import { useAccount } from "@/components/account/AccountProvider";
import { loadIntegrationConnections } from "@/lib/integrations/connection-store";
import {
  getIntegrationsHref,
  getKnowledgeHref,
  getResponsibilitiesHref,
} from "@/lib/peer-experience/marketing/navigation/marketing-peer-links";
import type { useMarketingWorkspace } from "@/hooks/useMarketingWorkspace";
import {
  applyBudgetAutonomyLimit,
  applyEmailRoutineAutonomous,
  applyRoutinePostingAutonomous,
  applyWebsiteBlogAutonomous,
  applyWorkspaceAutonomyMode,
  deriveBudgetAutonomyLimit,
  deriveEmailRoutineAutonomous,
  deriveRoutinePostingAutonomous,
  deriveWebsiteBlogAutonomous,
  deriveWorkspaceAutonomyMode,
  type WorkspaceAutonomyMode,
} from "../lib/marketing-settings-policy";

export type SettingsTabProps = {
  peerId: string;
  workspace: ReturnType<typeof useMarketingWorkspace>;
  onAudit?: (title: string, description: string) => void;
};

const MODE_OPTIONS: Array<{ id: WorkspaceAutonomyMode; label: string; hint: string }> = [
  {
    id: "always_ask",
    label: "Always ask",
    hint: "Emma suggests work and waits for you on most actions.",
  },
  {
    id: "strategic_only",
    label: "Strategic decisions only",
    hint: "Routine work can proceed; budget, brand and high-risk changes need you.",
  },
  {
    id: "fully_autonomous",
    label: "Fully autonomous within limits",
    hint: "Emma acts inside guardrails you set below.",
  },
];

export default function SettingsTab({ peerId, workspace, onAudit }: SettingsTabProps) {
  const { organizationId } = useAccount();
  const peerName = workspace.peer?.name ?? "Emma";
  const connections = useMemo(
    () => (organizationId ? loadIntegrationConnections(organizationId) : []),
    [organizationId]
  );

  const { automations, syncedWorkUnits, responsibilities, updateResponsibilities } = workspace;
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const mode = deriveWorkspaceAutonomyMode(responsibilities);
  const routinePosting = deriveRoutinePostingAutonomous(responsibilities);
  const budgetLimit = deriveBudgetAutonomyLimit(responsibilities) ?? 500;
  const websiteBlog = deriveWebsiteBlogAutonomous(responsibilities);
  const emailRoutine = deriveEmailRoutineAutonomous(responsibilities);

  const persist = (next: typeof responsibilities, auditTitle: string, auditDetail: string) => {
    setSaving(true);
    setError(null);
    try {
      updateResponsibilities(next);
      onAudit?.(auditTitle, auditDetail);
    } catch {
      setError("Could not save settings. Your previous policy is still in effect.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <section className="mw-section" style={{ animationDelay: "0.05s" }}>
        <div className="mw-section-head">
          <div className="mw-section-title">
            <Settings2 size={15} aria-hidden />
            Autonomy
          </div>
        </div>
        <p className="mw-kn-helper" style={{ marginBottom: 16 }}>
          Controls how {peerName} creates decisions and publishes work. Changes persist to
          responsibilities and guardrails.
        </p>
        {error && <p className="mw-empty-inline" style={{ color: "#f5b754", marginBottom: 12 }}>{error}</p>}
        <div className="mw-settings-modes">
          {MODE_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              disabled={saving}
              className={`mw-glass mw-settings-mode pg-focus-premium${
                mode === opt.id ? " mw-settings-mode--active" : ""
              }`}
              onClick={() =>
                persist(
                  applyWorkspaceAutonomyMode(responsibilities, opt.id),
                  "Autonomy mode updated",
                  opt.label
                )
              }
            >
              <div className="mw-settings-mode-label">{opt.label}</div>
              <div className="mw-kn-helper">{opt.hint}</div>
            </button>
          ))}
        </div>
      </section>

      <section className="mw-section" style={{ animationDelay: "0.1s" }}>
        <div className="mw-section-title" style={{ marginBottom: 14 }}>
          Area rules
        </div>
        <div className="mw-settings-rules">
          <SettingToggle
            label="Posting — routine content auto-publish"
            hint="Sensitive or brand-led posts still require a decision when approval is on."
            checked={routinePosting}
            disabled={saving}
            onChange={(checked) =>
              persist(
                applyRoutinePostingAutonomous(responsibilities, checked),
                "Posting policy updated",
                checked ? "Routine posts may auto-publish" : "Posting requires decisions"
              )
            }
          />
          <SettingBudget
            label="Advertising — autonomous below limit"
            limit={budgetLimit}
            disabled={saving}
            onChange={(limit) =>
              persist(
                applyBudgetAutonomyLimit(responsibilities, limit),
                "Budget threshold updated",
                `Autonomous spend up to ${limit}`
              )
            }
          />
          <SettingToggle
            label="Website — blog may auto-publish"
            hint="Material landing-page or site structure changes still require review."
            checked={websiteBlog}
            disabled={saving}
            onChange={(checked) =>
              persist(
                applyWebsiteBlogAutonomous(responsibilities, checked),
                "Website policy updated",
                checked ? "Blog content may auto-publish" : "Website changes need review"
              )
            }
          />
          <SettingToggle
            label="Email — routine sends autonomous"
            hint="Large or high-risk sends require a decision."
            checked={emailRoutine}
            disabled={saving}
            onChange={(checked) =>
              persist(
                applyEmailRoutineAutonomous(responsibilities, checked),
                "Email policy updated",
                checked ? "Routine email may send automatically" : "Email requires approval"
              )
            }
          />
        </div>
      </section>

      <section className="mw-section" style={{ animationDelay: "0.14s" }}>
        <div className="mw-section-title" style={{ marginBottom: 12 }}>
          Connected channels
        </div>
        <ul className="mw-settings-channels">
          {connections.map((channel) => (
            <li key={channel.id}>
              <Link href={channel.settingsHref} className="mw-glass mw-settings-channel pg-focus-premium">
                <span>{channel.label}</span>
                <span className="mw-kn-helper">
                  {channel.status === "connected" ? "Connected" : "Setup"}
                </span>
              </Link>
            </li>
          ))}
        </ul>
        <Link href={getIntegrationsHref()} className="mw-section-link" style={{ marginTop: 10 }}>
          All integrations →
        </Link>
      </section>

      <section className="mw-section" style={{ animationDelay: "0.18s" }}>
        <div className="mw-section-head">
          <div className="mw-section-title">Active automations</div>
          <Link href={getResponsibilitiesHref(peerId)} className="mw-section-link">
            Responsibilities
          </Link>
        </div>
        {automations.length === 0 ? (
          <p className="mw-empty-inline">
            No automations yet. Use Assign work and choose a recurring schedule.
          </p>
        ) : (
          <ul className="mw-settings-auto">
            {automations.map((automation) => {
              const unit = syncedWorkUnits.find((u) => u.id === automation.workUnitId);
              return (
                <li key={automation.id} className="mw-glass mw-settings-auto-row">
                  <div>
                    <div className="mw-approval-title">{unit?.title ?? "Automation"}</div>
                    <div className="mw-kn-helper">
                      {automation.triggerLabel ?? automation.recurrence} ·{" "}
                      {automation.active ? "Running" : "Paused"}
                    </div>
                  </div>
                  <div className="mw-approval-actions">
                    <button
                      type="button"
                      className="mw-btn-review pg-focus-premium"
                      onClick={() => workspace.handleToggleAutomation(automation.id)}
                    >
                      {automation.active ? "Pause" : "Enable"}
                    </button>
                    <button
                      type="button"
                      className="mw-btn-review pg-focus-premium"
                      onClick={() => workspace.handleDeleteAutomation(automation.id)}
                    >
                      Delete
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="mw-section" style={{ animationDelay: "0.22s", marginBottom: 0 }}>
        <div className="mw-section-title" style={{ marginBottom: 8 }}>
          Knowledge & brand
        </div>
        <p className="mw-kn-helper">
          Strategy and brand context live under Knowledge — not duplicated here.
        </p>
        <Link href={getKnowledgeHref(peerId)} className="mw-section-link">
          Open Knowledge →
        </Link>
      </section>
    </>
  );
}

function SettingToggle({
  label,
  hint,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  hint: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="mw-glass mw-settings-rule">
      <div>
        <div className="mw-settings-rule-label">{label}</div>
        <p className="mw-kn-helper">{hint}</p>
      </div>
      <label className="mw-toggle">
        <input
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span className="mw-toggle-ui" aria-hidden />
      </label>
    </div>
  );
}

function SettingBudget({
  label,
  limit,
  disabled,
  onChange,
}: {
  label: string;
  limit: number;
  disabled?: boolean;
  onChange: (limit: number) => void;
}) {
  return (
    <div className="mw-glass mw-settings-rule">
      <div>
        <div className="mw-settings-rule-label">{label}</div>
        <p className="mw-kn-helper">Spend above this amount requires your decision.</p>
      </div>
      <input
        type="number"
        min={0}
        step={50}
        disabled={disabled}
        className="mw-modal-input mw-settings-budget"
        value={limit}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
        aria-label="Autonomous budget limit"
      />
    </div>
  );
}