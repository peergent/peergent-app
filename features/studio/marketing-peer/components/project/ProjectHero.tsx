"use client";

import Link from "next/link";
import type { ProjectHeroViewModel } from "@/lib/peer-experience/marketing/projects/project-experience-types";
import { cn } from "@/lib/ui/cn";

export type ProjectHeroProps = {
  hero: ProjectHeroViewModel;
  peerName: string;
};

export default function ProjectHero({ hero, peerName }: ProjectHeroProps) {
  const isReview = hero.priority === "needs_you";

  return (
    <section
      className={cn(
        "mp-project-hero",
        hero.isLive && "mp-project-hero--live",
        isReview && "mp-project-hero--review"
      )}
      aria-live={hero.isLive ? "polite" : undefined}
    >
      <div className="mp-project-hero__top">
        <div>
          <p className="mp-project-hero__phase">{hero.phaseLabel}</p>
          <h2 className="mp-project-hero__title">{hero.title}</h2>
          <p className="mp-project-hero__goal">{hero.goal}</p>
        </div>
        {hero.isLive && (
          <span className="mp-project-hero__live-badge">
            <span className="mp-project-hero__live-dot" aria-hidden />
            Live
          </span>
        )}
      </div>

      <div className="mp-project-hero__progress-wrap">
        <div className="mp-project-hero__progress-meta">
          <span>{hero.progress}% complete</span>
          <span className="mp-project-hero__status">{hero.statusLabel}</span>
        </div>
        <div className="mp-project-hero__progress-track" role="progressbar" aria-valuenow={hero.progress} aria-valuemin={0} aria-valuemax={100}>
          <div
            className="mp-project-hero__progress-fill"
            style={{ width: `${hero.progress}%` }}
          />
        </div>
      </div>

      <div className="mp-project-hero__activity">
        {isReview ? (
          <>
            <p className="mp-project-hero__activity-label">Waiting for your review</p>
            <p className="mp-project-hero__activity-text">{hero.heroMessage}</p>
          </>
        ) : (
          <>
            <p className="mp-project-hero__activity-label">
              {hero.isLive ? `${peerName} is working` : "Current activity"}
            </p>
            <p className="mp-project-hero__activity-text">{hero.currentActivity}</p>
          </>
        )}
      </div>

      <div className="mp-project-hero__footer">
        {hero.estimatedCompletion && (
          <p className="mp-project-hero__eta">
            Estimated completion: <strong>{hero.estimatedCompletion}</strong>
          </p>
        )}
        {hero.primaryCta && (
          <Link href={hero.primaryCta.href} className="mp-project-hero__cta pg-focus-premium">
            {hero.primaryCta.label}
          </Link>
        )}
      </div>
    </section>
  );
}
