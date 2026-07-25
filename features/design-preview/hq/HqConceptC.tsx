"use client";

import "./hq-preview.css";
import { HQ_BRIEFING_ITEMS, HQ_MANAGER, HQ_SPECIALISTS } from "./hq-preview-data";
import {
  HqBriefingReadyPopover,
  HqConceptNav,
  HqGreeting,
  HqPreviewBanner,
  HqSpecialistCard,
} from "./hq-preview-shared";

export default function HqConceptC() {
  return (
    <div className="hq-preview-page">
      <HqPreviewBanner concept="Concept C — Manager Desk" />
      <div className="hq-preview-canvas">
        <HqConceptNav active="c" />
        <HqGreeting />

        <div className="hq-concept-c">
          <aside className="hq-concept-c__brief">
            <article className="hq-manager hq-manager--hero" title={`Preview: ${HQ_MANAGER.destinationLabel}`}>
              <HqBriefingReadyPopover />
              <div className="hq-manager__avatar" aria-hidden>
                {HQ_MANAGER.name.charAt(0)}
              </div>
              <div className="hq-manager__body">
                <p className="hq-manager__role">{HQ_MANAGER.role}</p>
                <h2 className="hq-manager__name">{HQ_MANAGER.name}</h2>
                <p className="hq-manager__state">{HQ_MANAGER.state}</p>
                <ul className="hq-manager__brief-list">
                  {HQ_BRIEFING_ITEMS.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
                <button type="button" className="hq-cta pg-focus-premium">
                  {HQ_MANAGER.cta}
                  <span className="hq-cta__hint">→ {HQ_MANAGER.destinationLabel}</span>
                </button>
              </div>
            </article>
          </aside>

          <section className="hq-concept-c__team" aria-label="Digital team panel">
            <h2 className="hq-greeting__title" style={{ fontSize: "1.25rem" }}>
              Your digital team
            </h2>
            <p className="hq-greeting__support" style={{ marginTop: "0.5rem", marginBottom: "1.25rem" }}>
              Click a colleague to open their workspace.
            </p>
            <div className="hq-concept-c__team-list">
              {HQ_SPECIALISTS.map((peer) => (
                <HqSpecialistCard key={peer.id} peer={peer} layout="row" />
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
