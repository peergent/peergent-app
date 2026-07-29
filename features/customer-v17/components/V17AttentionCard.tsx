"use client";

import Link from "next/link";
import type { V17CcAttentionCard } from "@/lib/customer-v17/build-v17-cc-attention";
import { v17AttentionCtas } from "@/lib/customer-v17/build-v17-cc-attention";
import { v17PeerAccentClass } from "@/lib/customer-v17/peer-accent";
import { CcPeerIcon } from "@/features/home/command-center/components/CcPeerIcon";

export function V17AttentionCard({
  card,
  copy,
}: {
  card: V17CcAttentionCard;
  copy: { reviewCta: string; viewCta: string; approveCta: string };
}) {
  const ctas = v17AttentionCtas(card, copy);
  return (
    <article className="v17-decision" data-testid={`v17-attention-${card.id}`}>
      <div className="v17-decision-main">
        <div className={`v17-icon-box ${v17PeerAccentClass(card.serviceKey)}`}>
          <CcPeerIcon serviceKey={card.serviceKey} />
        </div>
        <div className="v17-decision-text">
          <p className="v17-decision-title">{card.title}</p>
          <p className="v17-decision-sub">{card.contextLine}</p>
        </div>
      </div>
      <div className="v17-decision-actions">
        {ctas.secondary ? (
          <Link href={ctas.secondary.href} className="v17-btn v17-btn--ghost v17-btn--sm pg-focus-premium">
            {ctas.secondary.label}
          </Link>
        ) : null}
        <Link href={ctas.primary.href} className="v17-btn v17-btn--primary v17-btn--sm pg-focus-premium">
          {ctas.primary.label}
        </Link>
      </div>
    </article>
  );
}
