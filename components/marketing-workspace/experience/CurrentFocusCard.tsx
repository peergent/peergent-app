"use client";

import { Crosshair } from "lucide-react";
import WorkspacePanel from "@/components/peer-detail/WorkspacePanel";
import type { CurrentFocus } from "@/lib/marketing-workspace/experience";

type CurrentFocusCardProps = {
  focus: CurrentFocus;
};

export default function CurrentFocusCard({ focus }: CurrentFocusCardProps) {
  return (
    <WorkspacePanel title="Current focus" compact>
      <div className="flex gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-violet-500/20 bg-violet-500/10 text-violet-300">
          <Crosshair size={16} aria-hidden />
        </span>
        <div>
          <p className="text-sm font-medium text-white">{focus.headline}</p>
          <p className="mt-1.5 text-sm leading-relaxed text-slate-500">{focus.detail}</p>
        </div>
      </div>
    </WorkspacePanel>
  );
}
