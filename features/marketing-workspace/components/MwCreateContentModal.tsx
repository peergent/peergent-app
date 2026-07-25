"use client";

import { useState } from "react";
import type { DelegationTask } from "@/lib/peer-experience/marketing/parse-delegation-intent";
import {
  finalizeDelegationTask,
  parseDelegationIntent,
} from "@/lib/peer-experience/marketing/parse-delegation-intent";
import MwModal from "./MwModal";

const PLATFORMS = [
  { id: "linkedin", label: "LinkedIn" },
  { id: "instagram", label: "Instagram" },
  { id: "newsletter", label: "Email" },
  { id: "blog", label: "Blog" },
] as const;

export type MwCreateContentModalProps = {
  open: boolean;
  onClose: () => void;
  peerName: string;
  onExecute: (task: DelegationTask) => Promise<void>;
  busy?: boolean;
};

export default function MwCreateContentModal({
  open,
  onClose,
  peerName,
  onExecute,
  busy,
}: MwCreateContentModalProps) {
  const [platform, setPlatform] = useState<(typeof PLATFORMS)[number]["id"]>("linkedin");
  const [brief, setBrief] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setError(null);
    const message = `${platform} post${brief.trim() ? `: ${brief.trim()}` : ""}`;
    const intent = parseDelegationIntent(message);
    const task = finalizeDelegationTask(intent, {}, "once");
    try {
      await onExecute(task);
      onClose();
      setBrief("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not start generation.");
    }
  };

  return (
    <MwModal
      open={open}
      onClose={onClose}
      title="Create a post"
      subtitle={`${peerName} will draft it — you choose what happens next based on autonomy settings.`}
    >
      <p className="mw-modal-label">Platform</p>
      <div className="mw-platform-chips">
        {PLATFORMS.map((p) => (
          <button
            key={p.id}
            type="button"
            className={`mw-platform-chip pg-focus-premium${platform === p.id ? " mw-platform-chip--active" : ""}`}
            onClick={() => setPlatform(p.id)}
          >
            {p.label}
          </button>
        ))}
      </div>
      <p className="mw-modal-label" style={{ marginTop: 20 }}>
        What&apos;s this about? <span className="mw-modal-label-hint">(optional)</span>
      </p>
      <textarea
        className="mw-modal-input"
        rows={3}
        value={brief}
        onChange={(e) => setBrief(e.target.value)}
        placeholder="e.g. Announce the summer sale ending this week"
      />
      {error && <p className="mw-empty-inline" style={{ color: "var(--mw-amber, #f5b754)", marginTop: 8 }}>{error}</p>}
      <button
        type="button"
        className="mw-btn-primary mw-btn-primary--full pg-focus-premium"
        style={{ marginTop: 18 }}
        disabled={busy}
        onClick={() => void handleGenerate()}
      >
        {busy ? "Starting…" : "Generate with " + peerName}
      </button>
    </MwModal>
  );
}
