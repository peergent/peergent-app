"use client";

import "./hq-preview.css";
import { HQ_BUSINESS_HEALTH, HQ_SPECIALISTS } from "./hq-preview-data";
import {
  HqConceptNav,
  HqConnectionSvg,
  HqGreeting,
  HqManagerCard,
  HqPreviewBanner,
  HqSpecialistCard,
} from "./hq-preview-shared";

const URGENCY_SORT = [...HQ_SPECIALISTS].sort((a, b) => {
  if (a.attention !== b.attention) return a.attention ? -1 : 1;
  return a.name.localeCompare(b.name);
});

export default function HqConceptD() {
  return (
    <div className="hq-preview-page">
      <HqPreviewBanner concept="Concept D — Business Command View" />
      <div className="hq-preview-canvas hq-concept-d">
        <HqConceptNav active="d" />
        <HqGreeting />

        <div className="hq-concept-d__top">
          <HqManagerCard variant="hero" showBriefingList />
          <div className="hq-health-strip">
            <p className="hq-health-strip__label">{HQ_BUSINESS_HEALTH.label}</p>
            <p className="hq-health-strip__summary">{HQ_BUSINESS_HEALTH.summary}</p>
            <p className="hq-health-strip__score">{HQ_BUSINESS_HEALTH.scoreLabel}</p>
            <HqConnectionSvg variant="mesh" />
          </div>
        </div>

        <section className="hq-concept-d__peers" aria-label="Peers by urgency">
          <h2 className="hq-greeting__title" style={{ fontSize: "1.125rem", marginBottom: "0.25rem" }}>
            Team status
          </h2>
          <p className="hq-greeting__support" style={{ marginBottom: "1rem" }}>
            Sorted by what needs you first.
          </p>
          {URGENCY_SORT.map((peer) => (
            <HqSpecialistCard key={peer.id} peer={peer} layout="row" />
          ))}
        </section>
      </div>
    </div>
  );
}
