import { cn } from "@/lib/ui/cn";

/**
 * §4.5 One chart, not three. Area fill, faint grid, emphasised endpoint.
 *
 * Drawn as inline SVG rather than a charting dependency: the spec asks for a
 * single restrained shape, and a library would bring interaction affordances
 * the design deliberately does not want.
 */

export type PgTrendChartProps = {
  points: readonly { at: string; value: number }[];
  label: string;
  height?: number;
  /**
   * Line colour, as a CSS colour or `var(...)`. Defaults to the accent, which
   * is correct when the chart plots something Emma is reporting on directly.
   * A chart of production activity — volume, counts — is not her voice and
   * should use `var(--pg-state-neutral)` instead, per the state colour
   * contract: purple means "Emma is speaking," and a shape on an axis is not.
   */
  colorVar?: string;
  className?: string;
  testId?: string;
};

export default function PgTrendChart({
  points,
  label,
  height = 120,
  colorVar = "var(--pg-color-accent)",
  className,
  testId,
}: PgTrendChartProps) {
  // Below two points there is no shape to draw, and a single dot would imply
  // a trend that does not exist.
  if (points.length < 2) return null;

  const width = 640;
  const padY = 10;
  const values = points.map((p) => p.value);
  const max = Math.max(...values);
  const min = Math.min(...values);
  const span = max - min || 1;

  const coords = points.map((point, index) => {
    const x = (index / (points.length - 1)) * width;
    const y = padY + (1 - (point.value - min) / span) * (height - padY * 2);
    return { x, y };
  });

  const line = coords.map((c, i) => `${i === 0 ? "M" : "L"}${c.x},${c.y}`).join(" ");
  const area = `${line} L${width},${height} L0,${height} Z`;
  const last = coords[coords.length - 1]!;

  return (
    <figure className={cn("m-0", className)} data-testid={testId}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        className="block h-[var(--pg-trend-height,120px)] w-full"
        role="img"
        aria-label={`${label}: ${points.length} points, ending at ${last ? values[values.length - 1] : 0}`}
      >
        {/* Faint grid — three rules, never a full lattice. */}
        {[0.25, 0.5, 0.75].map((ratio) => (
          <line
            key={ratio}
            x1={0}
            x2={width}
            y1={padY + ratio * (height - padY * 2)}
            y2={padY + ratio * (height - padY * 2)}
            stroke="var(--pg-color-divider)"
            strokeWidth={1}
            vectorEffect="non-scaling-stroke"
          />
        ))}

        <path d={area} fill={colorVar} opacity={0.09} />
        <path
          d={line}
          fill="none"
          stroke={colorVar}
          strokeWidth={1.5}
          vectorEffect="non-scaling-stroke"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* Emphasised endpoint — where the story currently ends. */}
        <circle cx={last.x} cy={last.y} r={3} fill={colorVar} />
      </svg>
    </figure>
  );
}
