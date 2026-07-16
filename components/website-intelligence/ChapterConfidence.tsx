import type { ChapterConfidence } from "@/lib/website-intelligence";

type ChapterConfidenceProps = {
  confidence: ChapterConfidence;
};

function confidenceLabel(level: ChapterConfidence["level"]) {
  return level.charAt(0).toUpperCase() + level.slice(1);
}

export default function ChapterConfidence({ confidence }: ChapterConfidenceProps) {
  return (
    <p className="mt-4 text-xs leading-5 text-slate-600">
      <span className="text-slate-500">{confidenceLabel(confidence.level)} confidence</span>
      {" — "}
      {confidence.reason}
    </p>
  );
}
