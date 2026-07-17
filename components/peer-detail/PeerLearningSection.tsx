"use client";

import type { LearningItem } from "@/lib/peer-detail";
import WorkspacePanel from "./WorkspacePanel";

type PeerLearningSectionProps = {
  items: LearningItem[];
};

export default function PeerLearningSection({ items }: PeerLearningSectionProps) {
  return (
    <WorkspacePanel title="Learning this week">
      <ul className="space-y-3">
        {items.map((item) => (
          <li
            key={item.id}
            className="flex items-start gap-3 text-sm leading-relaxed text-slate-400"
          >
            <span
              className="mt-2 h-1 w-1 shrink-0 rounded-full bg-violet-400/70"
              aria-hidden
            />
            {item.text}
          </li>
        ))}
      </ul>
    </WorkspacePanel>
  );
}
