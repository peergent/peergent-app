import Avatar from "@/components/ui/Avatar";
import { getRoleConfig } from "@/lib/peer-display";
import type { NowPresence } from "@/lib/peer-experience";
import { cn } from "@/lib/ui/cn";

export type PgPeerPresenceProps = {
  peerName: string;
  peerRole: string;
  statusLine: string;
  presence: NowPresence;
  className?: string;
};

function avatarPresence(presence: NowPresence): "live" | "idle" | undefined {
  switch (presence) {
    case "live":
    case "working":
      return "live";
    case "waiting":
      return "idle";
  }
}

/**
 * Presence strip — Maya's voice in the room, not a profile header.
 */
export default function PgPeerPresence({
  peerName,
  peerRole,
  statusLine,
  presence,
  className,
}: PgPeerPresenceProps) {
  const roleConfig = getRoleConfig(peerRole);

  return (
    <div
      className={cn(
        "flex min-h-[3.25rem] shrink-0 items-center gap-2.5 border-b border-[var(--pg-color-border-subtle)]/80",
        "px-4 py-2.5 md:px-8",
        className
      )}
    >
      <Avatar
        name={peerName}
        gradient={roleConfig.gradient}
        size="sm"
        presence={avatarPresence(presence)}
      />

      <p
        className="min-w-0 flex-1 truncate text-sm leading-relaxed text-[var(--pg-color-text-secondary)]"
        aria-live="polite"
        aria-atomic="true"
      >
        <span className="font-medium text-[var(--pg-color-text-primary)]">{peerName}</span>
        <span className="text-[var(--pg-color-text-tertiary)]" aria-hidden>
          {" "}
          ·{" "}
        </span>
        <span>{statusLine}</span>
      </p>

      <span className="sr-only">{roleConfig.roleLabel}</span>
    </div>
  );
}
