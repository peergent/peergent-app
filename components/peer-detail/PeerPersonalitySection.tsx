"use client";

import WorkspacePanel from "./WorkspacePanel";

type PeerPersonalitySectionProps = {
  traits: string[];
};

export default function PeerPersonalitySection({
  traits,
}: PeerPersonalitySectionProps) {
  return (
    <WorkspacePanel title="Working style" compact>
      <p className="mb-3 text-sm leading-relaxed text-slate-500">
        How this colleague approaches their work.
      </p>
      <ul className="flex flex-wrap gap-2">
        {traits.map((trait) => (
          <li
            key={trait}
            className="rounded-full border border-white/[0.07] bg-white/[0.025] px-3.5 py-1.5 text-xs font-medium tracking-wide text-slate-300"
          >
            {trait}
          </li>
        ))}
      </ul>
    </WorkspacePanel>
  );
}
