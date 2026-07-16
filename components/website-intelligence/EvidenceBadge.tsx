import Badge from "@/components/ui/Badge";
import type { EvidenceCategory } from "@/lib/website-intelligence";

const categoryCopy: Record<EvidenceCategory, string> = {
  observed: "Observed",
  likely: "Likely",
  unknown: "Unknown",
  "requires-more-data": "Requires more data",
};

const categoryVariants: Record<
  EvidenceCategory,
  "success" | "accent" | "neutral" | "warning"
> = {
  observed: "success",
  likely: "accent",
  unknown: "neutral",
  "requires-more-data": "warning",
};

type EvidenceBadgeProps = {
  category: EvidenceCategory;
  className?: string;
};

export default function EvidenceBadge({ category, className }: EvidenceBadgeProps) {
  return (
    <Badge variant={categoryVariants[category]} size="sm" className={className}>
      {categoryCopy[category]}
    </Badge>
  );
}

export { categoryCopy as evidenceCategoryCopy };
