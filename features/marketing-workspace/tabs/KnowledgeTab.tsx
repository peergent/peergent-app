"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { BookOpen, Globe2, Lightbulb, Sparkles } from "lucide-react";
import { buildMarketingBrainInsights } from "@/lib/peer-experience/marketing/view-models/build-marketing-brain-insights";
import { buildMarketingKnowledgeViewModel } from "@/lib/peer-experience/marketing/view-models/build-marketing-knowledge-view-model";
import type { MarketingPeerDomainInput } from "@/lib/peer-experience/marketing/view-models/marketing-peer-domain-input";
import {
  buildMarketingKnowledgeItems,
  buildMarketingSkillsList,
  knowledgeStateLabel,
  websiteScanHref,
} from "../lib/build-knowledge-items";
import MwKnowledgeDetailModal from "../components/MwKnowledgeDetailModal";
import type { MarketingKnowledgeListItem } from "../lib/build-knowledge-items";

export type KnowledgeTabProps = {
  domainInput: MarketingPeerDomainInput;
};

export default function KnowledgeTab({ domainInput }: KnowledgeTabProps) {
  const vm = useMemo(() => buildMarketingKnowledgeViewModel(domainInput), [domainInput]);
  const items = useMemo(() => buildMarketingKnowledgeItems(domainInput), [domainInput]);
  const insights = useMemo(() => buildMarketingBrainInsights(domainInput), [domainInput]);
  const skills = useMemo(() => buildMarketingSkillsList(domainInput), [domainInput]);
  const [detail, setDetail] = useState<MarketingKnowledgeListItem | null>(null);

  return (
    <>
      <section className="mw-section mw-glass" style={{ animationDelay: "0.03s", padding: 22 }}>
        <div className="mw-section-title" style={{ marginBottom: 10 }}>
          <Globe2 size={15} aria-hidden />
          Website scan
        </div>
        <p className="mw-kn-helper">
          Run a real ingestion job on your site. Progress and findings persist to company knowledge
          with source provenance.
        </p>
        <Link href={websiteScanHref()} className="mw-btn-primary pg-focus-premium" style={{ marginTop: 14 }}>
          Open website intelligence
        </Link>
      </section>

      <section className="mw-section" style={{ animationDelay: "0.08s" }}>
        <div className="mw-section-head">
          <div className="mw-section-title">
            <Lightbulb size={15} aria-hidden />
            Strategic insights
          </div>
        </div>
        {insights.length === 0 ? (
          <p className="mw-empty-inline">
            Insights appear as {domainInput.peerName} learns from connected channels and your
            knowledge base.
          </p>
        ) : (
          <div className="mw-kn-insights">
            {insights.slice(0, 4).map((insight) => (
              <div key={insight.id} className="mw-glass mw-kn-insight-card">
                <div className="mw-kn-insight-title">{insight.title}</div>
                <p className="mw-kn-helper">{insight.observation}</p>
                {insight.recommendation && (
                  <p className="mw-kn-rec">
                    <strong>Recommendation:</strong> {insight.recommendation.summary}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="mw-section" style={{ animationDelay: "0.12s" }}>
        <div className="mw-section-head">
          <div className="mw-section-title">
            <Sparkles size={15} aria-hidden />
            Skills
          </div>
        </div>
        <ul className="mw-kn-skills">
          {skills.map((skill) => (
            <li key={skill.id} className="mw-glass mw-kn-skill">
              {skill.label}
            </li>
          ))}
        </ul>
        <button type="button" className="mw-btn-review pg-focus-premium" disabled title="Coming soon">
          + Add skill (coming soon)
        </button>
      </section>

      <section className="mw-section" style={{ animationDelay: "0.16s", marginBottom: 0 }}>
        <div className="mw-section-head">
          <div className="mw-section-title">
            <BookOpen size={15} aria-hidden />
            Knowledge items
          </div>
          {vm.completeness > 0 && (
            <span className="mw-count-badge">{vm.completeness}% complete</span>
          )}
        </div>
        <p className="mw-kn-helper" style={{ marginBottom: 14 }}>
          {vm.emptyMessage}
        </p>
        <div className="mw-kn-items">
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              className="mw-glass mw-kn-item pg-focus-premium"
              onClick={() => setDetail(item)}
            >
              <div className="mw-kn-item-title">{item.title}</div>
              <div className="mw-kn-item-meta">
                {item.source} · {knowledgeStateLabel(item.state)} · {item.updatedLabel}
              </div>
            </button>
          ))}
        </div>
      </section>

      <MwKnowledgeDetailModal open={detail != null} onClose={() => setDetail(null)} item={detail} />
    </>
  );
}
