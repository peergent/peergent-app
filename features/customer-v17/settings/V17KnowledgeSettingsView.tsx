"use client";

import Link from "next/link";
import type { V17KnowledgeSettingsViewModel } from "@/lib/customer-v17/build-v17-knowledge-settings-view-model";

export default function V17KnowledgeSettingsView({ model }: { model: V17KnowledgeSettingsViewModel }) {
  return (
    <div className="v17-settings-detail" data-testid="v17-knowledge-settings">
      <section className="v17-detail-card">
        <h3 className="v17-detail-card-title">{model.websiteTitle}</h3>
        <p className="v17-page-support">{model.websiteDescription}</p>
        <Link href={model.websiteHref} className="v17-btn v17-btn--primary v17-btn--sm pg-focus-premium">
          {model.websiteCta}
        </Link>
      </section>

      <section className="v17-detail-card">
        <h3 className="v17-detail-card-title">{model.insightsTitle}</h3>
        {model.insights.length === 0 ? (
          <p className="v17-page-support">{model.insightsEmpty}</p>
        ) : (
          <div className="v17-insight-grid">
            {model.insights.map((insight) => (
              <article key={insight.id} className="v17-insight-card">
                <h4 className="v17-insight-title">{insight.title}</h4>
                <p className="v17-insight-body">{insight.observation}</p>
                {insight.recommendation ? (
                  <p className="v17-insight-rec">
                    <span className="v17-insight-rec-label">Aanbeveling</span>
                    {insight.recommendation}
                  </p>
                ) : null}
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="v17-detail-card">
        <h3 className="v17-detail-card-title">{model.skillsTitle}</h3>
        {model.skills.length === 0 ? (
          <p className="v17-page-support">{model.skillsEmpty}</p>
        ) : (
          <div className="v17-skill-chips">
            {model.skills.map((skill) => (
              <span key={skill} className="v17-skill-chip">
                {skill}
              </span>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
