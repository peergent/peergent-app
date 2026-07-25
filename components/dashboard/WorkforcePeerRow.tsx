"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import PeerRoleIcon from "@/components/peer/PeerRoleIcon";
import Avatar from "@/components/ui/Avatar";
import InsetGroup from "@/components/ui/InsetGroup";
import StatusBadge from "@/components/ui/StatusBadge";
import { marketingPeerWorkspaceHref } from "@/lib/config/peer-studio";
import { getRoleConfig } from "@/lib/peer-display";
import type { PeerRow } from "@/lib/peer-display";
import { cn } from "@/lib/ui/cn";

type WorkforcePeerRowProps = {
  peer: PeerRow;
};

export default function WorkforcePeerRow({ peer }: WorkforcePeerRowProps) {
  const config = getRoleConfig(peer.role);
  const isActive = peer.status === "active";
  const workspaceHref =
    peer.role === "Marketing" ? marketingPeerWorkspaceHref(peer.id) : `/peers/${peer.id}`;

  return (
    <Link
      href={workspaceHref}
      className={cn(
        "group block rounded-[var(--pg-radius-lg)] focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/30"
      )}
    >
      <InsetGroup
        interactive
        padding="md"
        className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="flex min-w-0 flex-1 items-start gap-4">
          <Avatar
            icon={<PeerRoleIcon role={peer.role} size={22} />}
            gradient={config.gradient}
            size="lg"
            presence={isActive ? "live" : "idle"}
          />

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h3 className="text-base font-semibold text-white">{peer.name}</h3>
              <StatusBadge
                status={isActive ? "active" : "inactive"}
                label={isActive ? "Active" : "Available"}
              />
            </div>
            <p className="mt-1 text-sm text-violet-400/80">{config.roleLabel}</p>
          </div>
        </div>

        <div className="min-w-0 flex-1 border-t border-white/[0.06] pt-4 sm:border-l sm:border-t-0 sm:pl-6 sm:pt-0">
          <p className="text-[11px] uppercase tracking-[0.08em] text-slate-500">
            Workspace
          </p>
          <p className="mt-1.5 text-sm leading-6 text-slate-400">
            {peer.role === "Marketing"
              ? "Open the Marketing workspace to review understanding and drafts."
              : "Open the peer workspace to review settings and status."}
          </p>
        </div>

        <span className="inline-flex shrink-0 items-center gap-1 self-end text-sm text-violet-400/80 transition group-hover:text-violet-300 sm:self-center">
          {peer.role === "Marketing" ? "Marketing workspace" : "Open"}
          <ArrowRight size={14} />
        </span>
      </InsetGroup>
    </Link>
  );
}
