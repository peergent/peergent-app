"use client";

import { CheckCircle2, Sparkles } from "lucide-react";
import Link from "next/link";
import type { PeerWorkspaceCopy } from "@/lib/i18n/peer-workspace-copy";
import { SectionAction } from "./PeerColleaguePrimitives";

export type EmptyColleagueStateProps = {
  headline: string;
  body: string;
  copy: PeerWorkspaceCopy;
  lastOutcome?: { title: string; href: string | null } | null;
};

export function EmptyColleagueState({
  headline,
  body,
  copy,
  lastOutcome,
}: EmptyColleagueStateProps) {
  return (
    <div className="mw-cc-empty" data-testid="mw-colleague-empty">
      <div className="mw-cc-empty-icon" aria-hidden>
        <CheckCircle2 size={28} strokeWidth={1.5} />
      </div>
      <h2 className="mw-cc-empty-title">{headline}</h2>
      <p className="mw-cc-empty-body">{body}</p>
      {lastOutcome ? (
        <div className="mw-cc-empty-foot">
          <p className="mw-cc-meta-label">{copy.workingOnUpcoming}</p>
          <p className="mw-cc-meta-value">{lastOutcome.title}</p>
          {lastOutcome.href ? (
            <SectionAction href={lastOutcome.href} label={copy.sectionViewResult} variant="secondary" />
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export type CaughtUpStateProps = {
  model: import("@/lib/peer-experience/marketing/colleague/peer-presence-types").PeerWorkingOnViewModel;
  copy: PeerWorkspaceCopy;
};

export function CaughtUpColleagueState({ model, copy }: CaughtUpStateProps) {
  return (
    <EmptyColleagueState
      headline={model.focusLabel}
      body={model.description}
      copy={copy}
      lastOutcome={model.caughtUpLastOutcome}
    />
  );
}

export function WaitingEmptyState({ copy }: { copy: PeerWorkspaceCopy }) {
  return (
    <div className="mw-cc-empty" data-testid="mw-section-waiting-empty">
      <div className="mw-cc-empty-icon" aria-hidden>
        <Sparkles size={26} strokeWidth={1.5} />
      </div>
      <h2 className="mw-cc-empty-title">{copy.waitingEmptyTitle}</h2>
      <p className="mw-cc-empty-body">{copy.waitingEmptySupport}</p>
    </div>
  );
}

export function DoneEmptyState({ copy }: { copy: PeerWorkspaceCopy }) {
  return (
    <div className="mw-cc-empty" data-testid="mw-section-done-empty">
      <div className="mw-cc-empty-icon" aria-hidden>
        <CheckCircle2 size={26} strokeWidth={1.5} />
      </div>
      <p className="mw-cc-empty-body">{copy.doneEmpty}</p>
    </div>
  );
}
