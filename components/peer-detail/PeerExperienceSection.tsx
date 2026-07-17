"use client";

import type { ExperienceItem } from "@/lib/peer-detail";
import WorkspacePanel from "./WorkspacePanel";

type PeerExperienceSectionProps = {
  items: ExperienceItem[];
};

export default function PeerExperienceSection({
  items,
}: PeerExperienceSectionProps) {
  return (
    <WorkspacePanel title="Experience">
      <dl className="space-y-4">
        {items.map((item) => (
          <div key={item.label}>
            <dt className="text-xs text-slate-600">{item.label}</dt>
            <dd className="mt-1 text-base font-medium tracking-tight text-white/90">
              {item.value}
            </dd>
          </div>
        ))}
      </dl>
    </WorkspacePanel>
  );
}
