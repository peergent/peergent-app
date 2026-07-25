"use client";

import "./hq-preview.css";
import { HQ_SPECIALISTS } from "./hq-preview-data";
import {
  HqConceptNav,
  HqConnectionSvg,
  HqGreeting,
  HqManagerCard,
  HqPreviewBanner,
  HqSpecialistCard,
} from "./hq-preview-shared";

export default function HqConceptA() {
  return (
    <div className="hq-preview-page">
      <HqPreviewBanner concept="Concept A — Executive HQ" />
      <div className="hq-preview-canvas hq-concept-a">
        <HqConceptNav active="a" />
        <HqGreeting />

        <div className="hq-concept-a__manager-wrap">
          <HqManagerCard variant="hero" showBriefingList />
        </div>

        <section className="hq-concept-a__team" aria-label="Specialist team">
          <HqConnectionSvg variant="vertical" />
          <div className="hq-concept-a__team-grid">
            {HQ_SPECIALISTS.map((peer) => (
              <HqSpecialistCard key={peer.id} peer={peer} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
