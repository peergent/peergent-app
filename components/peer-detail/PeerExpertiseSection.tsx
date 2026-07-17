"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/ui/cn";
import WorkspacePanel from "./WorkspacePanel";

type PeerExpertiseSectionProps = {
  areas: string[];
  knowledgeHref: string;
  reducedMotion?: boolean;
};

export default function PeerExpertiseSection({
  areas,
  knowledgeHref,
  reducedMotion = false,
}: PeerExpertiseSectionProps) {
  return (
    <WorkspacePanel title="Expert in">
      <ul className="flex flex-wrap gap-2">
        {areas.map((area) => (
          <li key={area}>
            <span
              className={cn(
                "inline-block rounded-full border border-white/[0.08] bg-white/[0.03] px-3.5 py-1.5 text-xs font-medium text-slate-300",
                !reducedMotion &&
                  "transition duration-300 hover:border-violet-500/25 hover:bg-violet-500/[0.06] hover:text-violet-100/90"
              )}
            >
              {area}
            </span>
          </li>
        ))}
      </ul>

      <Link
        href={knowledgeHref}
        className="pg-focus-premium mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-violet-400/85 transition hover:text-violet-300"
      >
        Manage knowledge
        <ArrowRight size={14} aria-hidden />
      </Link>
    </WorkspacePanel>
  );
}
