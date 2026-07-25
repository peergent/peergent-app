"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { ExecutiveDecisionCardProps } from "./executive-brief";

export default function ExecutiveDecisionCard({ card }: { card: ExecutiveDecisionCardProps }) {
  const bodyParts = card.body.split("\n\n");

  return (
    <div className="pg-premium-frame executive-decision-card">
      <div className="pg-premium-frame-ambient" aria-hidden />
      <div className="pg-premium-frame-shimmer" aria-hidden />
      <div className="pg-premium-frame-inner executive-decision-inner">
        <h2 className="executive-decision-title">{card.title}</h2>
        {bodyParts.map((part, index) => (
          <p key={index} className="executive-decision-body">
            {part}
          </p>
        ))}
        <Link href={card.href} className="executive-decision-cta pg-focus-premium">
          <span>{card.ctaLabel}</span>
          <ArrowRight size={12} aria-hidden />
        </Link>
      </div>
    </div>
  );
}

export function ExecutiveBriefProse({
  text,
  peerNames,
}: {
  text: string;
  peerNames: string[];
}) {
  if (!peerNames.length) return <>{text}</>;

  const escaped = peerNames.map((name) => name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const pattern = new RegExp(`(${escaped.join("|")})`, "g");
  const parts = text.split(pattern).filter(Boolean);

  return (
    <>
      {parts.map((part, index) =>
        peerNames.includes(part) ? (
          <span key={`${part}-${index}`} className="brief-peer">
            {part}
          </span>
        ) : (
          <span key={`${index}-text`}>{part}</span>
        )
      )}
    </>
  );
}
