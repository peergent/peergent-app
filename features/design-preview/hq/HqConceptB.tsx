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

export default function HqConceptB() {
  return (
    <div className="hq-preview-page">
      <HqPreviewBanner concept="Concept B — Living Organization" />
      <div className="hq-preview-canvas">
        <HqConceptNav active="b" />
        <HqGreeting />

        <section className="hq-concept-b" aria-label="Living organization map">
          <HqConnectionSvg variant="radial" />
          <div className="hq-concept-b__center">
            <HqManagerCard variant="hero" showPopover showBriefingList={false} />
          </div>
          <div className="hq-concept-b__orbit">
            {HQ_SPECIALISTS.map((peer, index) => (
              <div key={peer.id} className={`hq-concept-b__orbit-item hq-concept-b__orbit-item--${index}`}>
                <HqSpecialistCard peer={peer} layout="orbit" />
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
