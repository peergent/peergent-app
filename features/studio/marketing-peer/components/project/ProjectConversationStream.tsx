"use client";

import type { ProjectConversationEntry } from "@/lib/peer-experience/marketing/projects/project-experience-types";
import { cn } from "@/lib/ui/cn";

export type ProjectConversationStreamProps = {
  entries: ProjectConversationEntry[];
  peerName: string;
  emptyMessage?: string;
};

export default function ProjectConversationStream({
  entries,
  peerName,
  emptyMessage,
}: ProjectConversationStreamProps) {
  return (
    <section className="mp-project-conversation">
      <h3 className="mp-project-section__title">{peerName}&apos;s workday</h3>
      {entries.length === 0 ? (
        <p className="mp-empty">{emptyMessage}</p>
      ) : (
        <ol className="mp-project-conversation__list">
          {entries.map((entry) => (
            <li
              key={entry.id}
              className={cn(
                "mp-project-conversation__item",
                `mp-project-conversation__item--${entry.kind}`
              )}
            >
              <span className="mp-project-conversation__time">{entry.timeLabel}</span>
              <p className="mp-project-conversation__message">&ldquo;{entry.message}&rdquo;</p>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
