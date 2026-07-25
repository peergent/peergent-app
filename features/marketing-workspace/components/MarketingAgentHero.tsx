"use client";

import Link from "next/link";
import {
  AlertTriangle,
  LineChart,
  MessageCircle,
  Pause,
  Settings,
} from "lucide-react";
import type { MarketingWorkspaceAgentViewModel } from "../view-model/marketing-workspace-types";

export type MarketingAgentHeroProps = {
  agent: MarketingWorkspaceAgentViewModel;
  onMessage?: () => void;
  onPause?: () => void;
  pauseDisabled?: boolean;
};

function workingLineWithEmphasis(line: string, projectName: string | null) {
  if (!projectName || !line.includes(projectName)) {
    return line;
  }
  const [before, after] = line.split(projectName);
  return (
    <>
      {before}
      <strong>{projectName}</strong>
      {after}
    </>
  );
}

export default function MarketingAgentHero({
  agent,
  onMessage,
  onPause,
  pauseDisabled,
}: MarketingAgentHeroProps) {
  const decisionLabel =
    agent.decisionCount === 1
      ? "1 decision waiting"
      : `${agent.decisionCount} decisions waiting`;

  return (
    <section className="mw-section mw-glass mw-agent-header" style={{ animationDelay: "0.03s" }}>
      <div className="mw-agent-header-top">
        <div className="mw-agent-id">
          <div className="mw-agent-orb" aria-hidden>
            <LineChart size={22} color="#fff" strokeWidth={2} />
          </div>
          <div>
            <h1 className="mw-agent-name">{agent.name}</h1>
            <p className="mw-agent-role">{agent.roleLabel}</p>
            <p className="mw-agent-line">
              {workingLineWithEmphasis(agent.workingLine, agent.workingProjectName)}
            </p>
            <p className="mw-agent-line-live">
              <span className="mw-live-dot" aria-hidden />
              {agent.liveStateLabel}
            </p>
            <p className="mw-agent-meta">{agent.metaLine}</p>
          </div>
        </div>
        <div className="mw-agent-side">
          {agent.decisionCount > 0 ? (
            <Link href={agent.reviewHref} className="mw-decision-pill pg-focus-premium">
              <AlertTriangle size={14} aria-hidden />
              {decisionLabel}
            </Link>
          ) : null}
          <div className="mw-agent-actions">
            <button
              type="button"
              className="mw-icon-btn pg-focus-premium"
              title="Message"
              aria-label="Message"
              onClick={onMessage}
            >
              <MessageCircle size={15} aria-hidden />
            </button>
            <button
              type="button"
              className="mw-icon-btn pg-focus-premium"
              title="Pause agent"
              aria-label="Pause agent"
              disabled={pauseDisabled}
              onClick={onPause}
            >
              <Pause size={15} aria-hidden />
            </button>
            <Link
              href={agent.settingsHref}
              className="mw-icon-btn pg-focus-premium"
              title="Settings"
              aria-label="Settings"
            >
              <Settings size={15} aria-hidden />
            </Link>
          </div>
        </div>
      </div>

      {agent.liveFeed.length > 0 && (
        <div className="mw-agent-livefeed">
          <div className="mw-livefeed-label">
            <span className="mw-live-dot" aria-hidden />
            Live
          </div>
          {agent.liveFeed.map((row) => (
            <div key={row.id} className="mw-livefeed-row">
              <span className="mw-lf-time">{row.timeLabel}</span>
              <span>{row.text}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
