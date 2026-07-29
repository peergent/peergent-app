"use client";

import type { PeerWorkingOnViewModel } from "@/lib/peer-experience/marketing/colleague/peer-presence-types";
import type { PeerWorkspaceCopy } from "@/lib/i18n/peer-workspace-copy";
import { SectionAction } from "./PeerColleaguePrimitives";
import { CaughtUpColleagueState } from "./EmptyColleagueState";

export type CurrentFocusCardProps = {
  model: PeerWorkingOnViewModel;
  copy: PeerWorkspaceCopy;
};

export function CurrentFocusCard({ model, copy }: CurrentFocusCardProps) {
  if (model.mode === "caught_up") {
    return <CaughtUpColleagueState model={model} copy={copy} />;
  }

  return (
    <article className="mw-cc-focus-card" data-testid="mw-current-focus-card">
      <p className="mw-cc-eyebrow">{model.focusLabel}</p>
      {model.focusTitle ? (
        <h2 className="mw-cc-focus-title">{model.focusTitle}</h2>
      ) : null}
      {model.stageLabel ? (
        <span className="mw-cc-stage-pill" role="status">
          {model.stageLabel}
        </span>
      ) : null}
      <p className="mw-cc-focus-desc">{model.description}</p>
      {model.progressLabel ? (
        <p className="mw-cc-progress-line">{model.progressLabel}</p>
      ) : null}
      {model.nextStep ? (
        <div className="mw-cc-focus-next">
          <p className="mw-cc-meta-label">{model.nextStepLabel ?? copy.workingOnNext}</p>
          <p className="mw-cc-meta-value mw-clamp-2">{model.nextStep}</p>
        </div>
      ) : null}
      {model.primaryAction ? (
        <div className="mw-cc-focus-actions">
          <SectionAction
            href={model.primaryAction.href}
            label={model.primaryAction.label}
            variant={model.primaryAction.variant}
          />
        </div>
      ) : null}
    </article>
  );
}

export type NextWorkListProps = {
  items: PeerWorkingOnViewModel["upcoming"];
  sectionLabel: string;
  openLabel: string;
};

export function NextWorkList({ items, sectionLabel, openLabel }: NextWorkListProps) {
  if (items.length === 0) return null;
  return (
    <section className="mw-cc-next-block" aria-label={sectionLabel}>
      <h3 className="mw-cc-subheading">{sectionLabel}</h3>
      <ul className="mw-cc-next-list">
        {items.map((item) => (
          <li key={item.id} className="mw-cc-next-item">
            <div>
              <p className="mw-cc-next-title">{item.title}</p>
              <p className="mw-cc-next-desc mw-clamp-2">{item.explanation}</p>
              {item.timingLabel ? (
                <p className="mw-cc-next-time">{item.timingLabel}</p>
              ) : null}
            </div>
            {item.href ? (
              <SectionAction href={item.href} label={openLabel} variant="secondary" />
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
