import Badge from "@/components/ui/Badge";
import PresenceIndicator, {
  type PresenceMode,
} from "@/components/ui/PresenceIndicator";
import { cn } from "@/lib/ui/cn";

export type StatusBadgeStatus =
  | "active"
  | "inactive"
  | "pending"
  | "success"
  | "warning"
  | "error"
  | "connected"
  | "waiting"
  | "thinking"
  | "watching";

export type StatusBadgeProps = {
  status: StatusBadgeStatus;
  label?: string;
  pulse?: boolean;
  className?: string;
};

const statusConfig: Record<
  StatusBadgeStatus,
  {
    variant: "success" | "neutral" | "warning" | "accent" | "danger";
    defaultLabel: string;
    presence: PresenceMode;
  }
> = {
  active: { variant: "success", defaultLabel: "Active", presence: "live" },
  inactive: { variant: "neutral", defaultLabel: "Inactive", presence: "ready" },
  pending: { variant: "warning", defaultLabel: "Pending", presence: "waiting" },
  success: { variant: "success", defaultLabel: "Success", presence: "ready" },
  warning: { variant: "warning", defaultLabel: "Warning", presence: "waiting" },
  error: { variant: "danger", defaultLabel: "Error", presence: "waiting" },
  connected: { variant: "success", defaultLabel: "Connected", presence: "live" },
  waiting: { variant: "warning", defaultLabel: "Waiting", presence: "waiting" },
  thinking: { variant: "accent", defaultLabel: "Thinking", presence: "thinking" },
  watching: { variant: "accent", defaultLabel: "Watching", presence: "watching" },
};

export default function StatusBadge({
  status,
  label,
  pulse,
  className,
}: StatusBadgeProps) {
  const config = statusConfig[status];
  const showPresence = pulse ?? config.presence !== "ready";

  return (
    <Badge variant={config.variant} size="sm" className={cn("gap-2", className)}>
      {showPresence && <PresenceIndicator mode={config.presence} />}
      {label ?? config.defaultLabel}
    </Badge>
  );
}
