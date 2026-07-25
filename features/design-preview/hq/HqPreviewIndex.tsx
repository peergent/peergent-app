"use client";

import Link from "next/link";
import "./hq-preview.css";
import { HQ_CONCEPTS } from "./hq-preview-data";
import { HqPreviewBanner } from "./hq-preview-shared";

export default function HqPreviewIndex() {
  return (
    <div className="hq-preview-page">
      <HqPreviewBanner concept="HQ exploration index" />
      <div className="hq-preview-canvas">
        <header className="hq-greeting">
          <p className="hq-greeting__eyebrow">Phase 1 · Design exploration</p>
          <h1 className="hq-greeting__title">Peergent HQ preview concepts</h1>
          <p className="hq-greeting__support">
            Four structurally different directions for the post-login command center. Mock data only.
            The current landing at <Link href="/home">/home</Link> is unchanged.
          </p>
        </header>

        <div className="hq-index-grid">
          {HQ_CONCEPTS.map((concept) => (
            <Link key={concept.id} href={`/design-preview/${concept.slug}`} className="hq-index-card pg-focus-premium">
              <p className="hq-index-card__title">Concept {concept.id.toUpperCase()} — {concept.title}</p>
              <p className="hq-index-card__summary">{concept.summary}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
