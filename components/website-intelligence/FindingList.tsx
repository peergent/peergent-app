import Link from "next/link";
import EvidenceBadge from "@/components/website-intelligence/EvidenceBadge";
import type { AssessmentFinding } from "@/lib/website-intelligence";

type FindingListProps = {
  findings: AssessmentFinding[];
  compact?: boolean;
};

export default function FindingList({ findings }: FindingListProps) {
  if (findings.length === 0) {
    return null;
  }

  return (
    <ul className="space-y-3">
      {findings.map((item) => (
        <li key={item.id} className="flex flex-wrap items-start justify-between gap-2">
          <p className="text-xs leading-5 text-slate-500">{item.statement}</p>
          <EvidenceBadge category={item.category} />
        </li>
      ))}
    </ul>
  );
}

type EnrichmentSlotsProps = {
  slots: import("@/lib/website-intelligence").ChapterEnrichmentSlot[];
};

export function EnrichmentSlots({ slots }: EnrichmentSlotsProps) {
  if (slots.length === 0) return null;

  return (
    <ul className="mt-4 space-y-2 border-t border-white/[0.06] pt-4">
      {slots.map((slot) => (
        <li
          key={slot.source}
          className="flex flex-wrap items-center justify-between gap-2 text-xs"
        >
          <span className="text-slate-500">{slot.label}</span>
          {slot.href ? (
            <Link
              href={slot.href}
              className="font-medium text-violet-400/80 transition hover:text-violet-300"
            >
              Connect
            </Link>
          ) : (
            <span className="text-slate-600">Not connected</span>
          )}
        </li>
      ))}
    </ul>
  );
}
