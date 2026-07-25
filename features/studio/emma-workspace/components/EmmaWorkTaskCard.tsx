"use client";

import type { EmmaWorkTaskViewModel } from "@/lib/peer-experience/marketing/emma-workspace-types";
import EmmaCard from "../components/EmmaCard";

export type EmmaWorkTaskCardProps = {
  task: EmmaWorkTaskViewModel;
  onSelect?: (workUnitId: string) => void;
  compact?: boolean;
};

export default function EmmaWorkTaskCard({
  task,
  onSelect,
  compact = false,
}: EmmaWorkTaskCardProps) {
  if (task.id === "empty") {
    return (
      <EmmaCard className="emma-current-work">
        <p className="emma-voice emma-voice--muted">{task.statusLabel}</p>
      </EmmaCard>
    );
  }

  return (
    <EmmaCard
      className={[
        "emma-current-work",
        task.isActive && !compact ? "emma-current-work--active" : "",
        task.isSelected ? "emma-current-work--selected" : "",
        "emma-current-work--clickable",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <h3 className="emma-current-work__title">{task.title}</h3>

      <dl className="emma-project-card__stats">
        <div>
          <dt>Status</dt>
          <dd>{task.statusLabel}</dd>
        </div>
        <div>
          <dt>Progress</dt>
          <dd>{task.progressPercent}%</dd>
        </div>
        <div>
          <dt>Started</dt>
          <dd>{task.startedLabel}</dd>
        </div>
        {task.etaLabel && (
          <div>
            <dt>ETA</dt>
            <dd>{task.etaLabel}</dd>
          </div>
        )}
      </dl>

      <div
        className="emma-project-card__progress"
        role="progressbar"
        aria-valuenow={task.progressPercent}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <span style={{ width: `${task.progressPercent}%` }} />
      </div>

      <button
        type="button"
        className="emma-project-card__open pg-focus-premium"
        onClick={() => onSelect?.(task.id)}
      >
        Open project
      </button>
    </EmmaCard>
  );
}
