import { cn } from "@/lib/ui/cn";

export type PgSparklineProps = {
  points: readonly { value: number }[];
  height?: number;
  colorVar?: string;
  className?: string;
  testId?: string;
};

/** Mini trend — max 7 points, no axes. */
export default function PgSparkline({
  points,
  height = 24,
  colorVar = "var(--pg-action-primary)",
  className,
  testId,
}: PgSparklineProps) {
  if (points.length < 2) return null;

  const width = 96;
  const pad = 2;
  const values = points.map((p) => p.value);
  const max = Math.max(...values);
  const min = Math.min(...values);
  const span = max - min || 1;

  const coords = points.map((point, index) => {
    const x = pad + (index / (points.length - 1)) * (width - pad * 2);
    const y = pad + (1 - (point.value - min) / span) * (height - pad * 2);
    return `${index === 0 ? "M" : "L"}${x},${y}`;
  });

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={cn("block h-6 w-full", className)}
      role="img"
      aria-hidden
      data-testid={testId}
    >
      <path
        d={coords.join(" ")}
        fill="none"
        stroke={colorVar}
        strokeWidth={1.5}
        vectorEffect="non-scaling-stroke"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
