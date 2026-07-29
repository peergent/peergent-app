"use client";

import Link from "next/link";
import type { V17WorkViewModel } from "@/lib/customer-v17/build-v17-work-view-model";

export type V17WorkViewProps = {
  model: V17WorkViewModel;
  onCreateCampaign?: () => void;
};

export default function V17WorkView({ model, onCreateCampaign }: V17WorkViewProps) {
  return (
    <div className="v17-section-page" data-testid="v17-work-view">
      <div className="v17-work-head">
        <div>
          <h2 className="v17-section-page-title">{model.title}</h2>
          <p className="v17-page-support">{model.subtitle}</p>
        </div>
        {onCreateCampaign ? (
          <button
            type="button"
            className="v17-btn v17-btn--primary v17-btn--sm pg-focus-premium"
            onClick={onCreateCampaign}
          >
            {model.createLabel}
          </button>
        ) : null}
      </div>
      {model.groups.map((group) => (
        <section key={group.id} className="v17-work-group">
          <h3 className="v17-work-group-title">{group.title}</h3>
          {group.rows.map((row) => (
            <Link key={row.id} href={row.href} className="v17-work-row pg-focus-premium">
              <div>
                <div className="v17-work-name">{row.name}</div>
                <div className="v17-work-meta">{row.metaLine}</div>
              </div>
              <span className="v17-status-tag">{row.statusTag}</span>
            </Link>
          ))}
        </section>
      ))}
    </div>
  );
}
