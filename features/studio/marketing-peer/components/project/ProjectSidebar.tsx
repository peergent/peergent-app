"use client";

import Link from "next/link";
import type {
  ProjectExperienceViewModel,
  ProjectSidebarViewModel,
} from "@/lib/peer-experience/marketing/projects/project-experience-types";

export type ProjectSidebarProps = {
  sidebar: ProjectSidebarViewModel;
  performanceHref: string;
};

export default function ProjectSidebar({ sidebar, performanceHref }: ProjectSidebarProps) {
  return (
    <aside className="mp-project-sidebar">
      <dl className="mp-project-sidebar__meta">
        <div>
          <dt>Goal</dt>
          <dd>{sidebar.goal}</dd>
        </div>
        {sidebar.originLabel && (
          <div>
            <dt>Origin</dt>
            <dd>{sidebar.originLabel}</dd>
          </div>
        )}
        {sidebar.responsibilityTitle && (
          <div>
            <dt>Responsibility</dt>
            <dd>
              {sidebar.responsibilityHref ? (
                <Link href={sidebar.responsibilityHref} className="mp-project-sidebar__link pg-focus-premium">
                  {sidebar.responsibilityTitle}
                </Link>
              ) : (
                sidebar.responsibilityTitle
              )}
            </dd>
          </div>
        )}
        <div>
          <dt>Campaign</dt>
          <dd>{sidebar.campaignTypeLabel}</dd>
        </div>
        <div>
          <dt>Status</dt>
          <dd>{sidebar.statusLabel}</dd>
        </div>
        <div>
          <dt>Progress</dt>
          <dd>{sidebar.progress}%</dd>
        </div>
        <div>
          <dt>Current phase</dt>
          <dd>{sidebar.phaseLabel}</dd>
        </div>
        {sidebar.dueLabel && (
          <div>
            <dt>Due</dt>
            <dd>{sidebar.dueLabel}</dd>
          </div>
        )}
        <div>
          <dt>Review</dt>
          <dd>{sidebar.reviewStatus}</dd>
        </div>
        <div>
          <dt>Publishing</dt>
          <dd>{sidebar.publishingStatus}</dd>
        </div>
        <div>
          <dt>Performance</dt>
          <dd>{sidebar.performanceStatus}</dd>
        </div>
      </dl>

      {sidebar.relatedContent.length > 0 && (
        <div className="mp-project-sidebar__content">
          <h4 className="mp-project-sidebar__heading">Related content</h4>
          <ul>
            {sidebar.relatedContent.map((item) => (
              <li key={item.id}>
                <Link href={item.href} className="mp-project-sidebar__link pg-focus-premium">
                  {item.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      <Link href={performanceHref} className="mp-section__link mt-4 inline-block text-sm">
        View performance →
      </Link>
    </aside>
  );
}

export type ProjectStateCardsProps = {
  experience: ProjectExperienceViewModel;
};

export function ProjectStateCards({ experience }: ProjectStateCardsProps) {
  return (
    <>
      {experience.publishing && (
        <section className="mp-project-state-card mp-project-state-card--publish" id="publishing">
          <h3 className="mp-project-section__title">Publishing {experience.publishing.scheduledDateLabel}</h3>
          <p className="mp-project-state-card__lead">{experience.publishing.message}</p>
          <dl className="mp-project-state-card__meta">
            <div>
              <dt>Scheduled for</dt>
              <dd>{experience.publishing.scheduledTimeLabel}</dd>
            </div>
            <div>
              <dt>Channel</dt>
              <dd>{experience.publishing.channel}</dd>
            </div>
          </dl>
        </section>
      )}

      {experience.monitoring && (
        <section className="mp-project-state-card" id="monitoring">
          <h3 className="mp-project-section__title">Monitoring</h3>
          <p className="mp-project-state-card__lead">{experience.monitoring.message}</p>
          {!experience.monitoring.hasLiveData && experience.monitoring.dataUnavailableReason && (
            <p className="mp-project-state-card__note">{experience.monitoring.dataUnavailableReason}</p>
          )}
        </section>
      )}

      {experience.learning && (
        <section className="mp-project-state-card mp-project-state-card--learning" id="insights">
          <h3 className="mp-project-section__title">Learning</h3>
          <p className="mp-project-state-card__lead">{experience.learning.summary}</p>
          {experience.learning.whatWorked && (
            <p className="mp-project-state-card__note">{experience.learning.whatWorked}</p>
          )}
          {experience.learning.whatToImprove && (
            <p className="mp-project-state-card__note">{experience.learning.whatToImprove}</p>
          )}
        </section>
      )}

      {experience.questions.length > 0 && (
        <section className="mp-project-state-card mp-project-state-card--questions" id="questions">
          <h3 className="mp-project-section__title">Emma has a question</h3>
          <ul className="mp-project-questions">
            {experience.questions.map((q) => (
              <li key={q.id} className="mp-project-questions__item">
                <p>{q.prompt}</p>
                {q.context && <span className="mp-project-questions__context">{q.context}</span>}
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
