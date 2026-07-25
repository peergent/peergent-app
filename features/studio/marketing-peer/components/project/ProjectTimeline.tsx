"use client";

import type { ProjectTimelineEntry } from "@/lib/peer-experience/marketing/projects/project-experience-types";
import { cn } from "@/lib/ui/cn";

export type ProjectTimelineProps = {
  entries: ProjectTimelineEntry[];
  emptyMessage?: string;
};

export default function ProjectTimeline({ entries, emptyMessage }: ProjectTimelineProps) {
  return (
    <section className="mp-project-timeline" id="timeline">
      <h3 className="mp-project-section__title">Progress timeline</h3>
      {entries.length === 0 ? (
        <p className="mp-empty">{emptyMessage}</p>
      ) : (
        <ol className="mp-project-timeline__list">
          {entries.map((entry) => (
            <li
              key={entry.id}
              className={cn(
                "mp-project-timeline__item",
                entry.isEmmaUpdate && "mp-project-timeline__item--update"
              )}
            >
              <span className="mp-project-timeline__dot" aria-hidden />
              <div className="mp-project-timeline__body">
                <span className="mp-project-timeline__time">{entry.timeLabel}</span>
                <p className="mp-project-timeline__message">{entry.message}</p>
                {entry.isEmmaUpdate && (
                  <span className="mp-project-timeline__badge">Emma update</span>
                )}
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
