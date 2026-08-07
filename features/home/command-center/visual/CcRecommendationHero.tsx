"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { CommandCenterRecommendation } from "@/lib/home/build-command-center-bands";

export function CcRecommendationHero({
  recommendation,
  href,
  nl,
}: {
  recommendation: CommandCenterRecommendation;
  href: string;
  nl: boolean;
}) {
  return (
    <article
      className="pg-cc6-card pg-cc6-recommendation pg-cc7-rec-hero pg-cc8-hero--rec pg-cc14-rec"
      data-testid="pg-cc-recommendation"
    >
      <div className="pg-cc7-rec-hero__glow" aria-hidden />

      <div className="pg-cc14-rec__inner">
        <div className="pg-cc14-rec__copy">
          <p className="pg-cc14-rec__eyebrow">
            {nl ? "AI aanbeveling" : "AI recommendation"}
          </p>
          <h2 className="pg-cc14-rec__headline">{recommendation.recommendation}</h2>
          {recommendation.impact ? (
            <p className="pg-cc14-rec__impact">{recommendation.impact}</p>
          ) : null}
        </div>

        <div className="pg-cc14-rec__aside">
          {recommendation.impactMetrics && recommendation.impactMetrics.length > 0 ? (
            <ul className="pg-cc14-rec__metrics">
              {recommendation.impactMetrics.map((metric) => (
                <li key={metric.id} className="pg-cc14-rec__metric">
                  {metric.label}
                </li>
              ))}
            </ul>
          ) : null}

          <Link href={href} className="pg-cc14-rec__cta pg-focus-premium">
            {recommendation.primaryLabel}
            <ArrowUpRight size={15} aria-hidden />
          </Link>
        </div>
      </div>
    </article>
  );
}
