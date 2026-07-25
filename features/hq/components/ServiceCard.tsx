"use client";

import Link from "next/link";
import type { HqServiceCard } from "@/lib/hq/build-hq-view-model";
import type { HqServiceKey } from "@/lib/hq/hq-service-key";
import {
  FinancePeerIcon,
  MarketingPeerIcon,
  OperationsPeerIcon,
  SalesPeerIcon,
  SupportPeerIcon,
} from "./hq-icons";

export type ServiceCardProps = {
  service: HqServiceCard;
  index: number;
  cardRef: (node: HTMLAnchorElement | null) => void;
};

function ServiceIcon({ kind }: { kind: HqServiceKey }) {
  switch (kind) {
    case "sales":
      return <SalesPeerIcon />;
    case "marketing":
      return <MarketingPeerIcon />;
    case "finance":
      return <FinancePeerIcon />;
    case "support":
      return <SupportPeerIcon />;
    case "operations":
      return <OperationsPeerIcon />;
    default:
      return <OperationsPeerIcon />;
  }
}

export default function ServiceCard({ service, index, cardRef }: ServiceCardProps) {
  const showLiveDot =
    service.statusKind === "working" || service.statusKind === "needs_attention";

  return (
    <div
      className={`hq-landing__peer-slot hq-landing__peer-slot--arc-${service.arcVariant}`}
      data-icon-kind={service.serviceKey}
      data-service-key={service.serviceKey}
    >
      <Link
        href={service.href}
        ref={cardRef}
        data-service-key={service.serviceKey}
        className="hq-landing__peer-card pg-focus-premium"
        aria-label={`Open ${service.label} workspace. ${service.statusLabel}. ${service.activity}`}
        style={{ animationDelay: `${0.55 + index * 0.13}s` }}
      >
        <div className="hq-landing__peer-top">
          <div className="hq-landing__peer-id">
            <div className={`hq-landing__peer-icon hq-landing__peer-icon--${service.serviceKey}`}>
              <ServiceIcon kind={service.serviceKey} />
            </div>
            <div className="hq-landing__peer-name">{service.label}</div>
          </div>
          <div className="hq-landing__peer-status">
            {showLiveDot && <span className="hq-landing__live-dot" aria-hidden />}
            {service.statusLabel}
          </div>
        </div>
        <div className="hq-landing__peer-desc">{service.activity}</div>
        <div className="hq-landing__peer-metric">
          {service.metric ?? service.colleagueLine}
        </div>
      </Link>
    </div>
  );
}
