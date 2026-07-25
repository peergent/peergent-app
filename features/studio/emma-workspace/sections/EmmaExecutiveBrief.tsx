"use client";

import type { EmmaExecutiveBriefViewModel } from "@/lib/peer-experience/marketing/emma-workspace-types";
import EmmaCard from "../components/EmmaCard";

export type EmmaExecutiveBriefProps = {
  model: EmmaExecutiveBriefViewModel;
};

function splitHighlights<T>(items: T[]): [T[], T[]] {
  const midpoint = Math.ceil(items.length / 2);
  return [items.slice(0, midpoint), items.slice(midpoint)];
}

export default function EmmaExecutiveBrief({ model }: EmmaExecutiveBriefProps) {
  const [leftColumn, rightColumn] = splitHighlights(model.highlights);

  return (
    <EmmaCard className="emma-executive-brief">
      <div className="emma-executive-brief__layout">
        <div className="emma-executive-brief__intro-col">
          <p className="emma-executive-brief__greeting">
            <span aria-hidden>👋</span> {model.greeting}, {model.userName}.
          </p>
          <p className="emma-executive-brief__intro">{model.intro}</p>
        </div>

        {model.highlights.length > 0 && (
          <div className="emma-executive-brief__checklist">
            <ul className="emma-executive-brief__list">
              {leftColumn.map((line) => (
                <li key={line.id}>
                  <span className="emma-story__check" aria-hidden>
                    ✓
                  </span>
                  {line.text}
                </li>
              ))}
            </ul>
            {rightColumn.length > 0 && (
              <ul className="emma-executive-brief__list">
                {rightColumn.map((line) => (
                  <li key={line.id}>
                    <span className="emma-story__check" aria-hidden>
                      ✓
                    </span>
                    {line.text}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <div className="emma-executive-brief__status" aria-hidden>
          <span className="emma-live-dot">
            <span className="emma-live-dot__pulse" />
          </span>
        </div>
      </div>
    </EmmaCard>
  );
}
