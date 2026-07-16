import Badge from "@/components/ui/Badge";
import type { DataLabel } from "@/lib/command-center/types";

const labelCopy: Record<DataLabel, string> = {
  "demo-insight": "Demo insight",
  provisional: "Provisional",
  "more-data-required": "More data required",
  "demo-activity": "Demo activity",
  "demo-data": "Demo data",
};

const labelVariants: Record<
  DataLabel,
  "accent" | "warning" | "default" | "neutral"
> = {
  "demo-insight": "accent",
  provisional: "warning",
  "more-data-required": "default",
  "demo-activity": "neutral",
  "demo-data": "neutral",
};

type DataLabelBadgeProps = {
  label: DataLabel;
};

export default function DataLabelBadge({ label }: DataLabelBadgeProps) {
  return <Badge variant={labelVariants[label]}>{labelCopy[label]}</Badge>;
}

export function getDomainStateLabel(
  state: import("@/lib/command-center/types").DomainHealthState
) {
  const labels = {
    "strong-signal": "Strong signal",
    developing: "Developing",
    "needs-data": "Needs data",
    "not-assessed": "Not assessed",
  };

  return labels[state];
}

export function getOverallHealthLabel(
  state: import("@/lib/command-center/types").QualitativeHealthState
) {
  const labels = {
    "baseline-in-progress": "Baseline in progress",
    preliminary: "Preliminary business health",
    "more-data-required": "More data required",
  };

  return labels[state];
}
