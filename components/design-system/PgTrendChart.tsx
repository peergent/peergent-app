import { cn } from "@/lib/ui/cn";

/**
 * §4.5 One chart, not three. Area fill, faint grid, emphasised endpoint.
 * PX-8 hero variant: thicker stroke, smooth curve, axis labels, glowing endpoint.
 */

export type PgTrendChartProps = {
  points: readonly { at: string; value: number }[];
  label: string;
  height?: number;
  colorVar?: string;
  areaFillVar?: string;
  animate?: boolean;
  endpointGlow?: boolean;
  /** Hero treatment for command center business impact chart. */
  variant?: "default" | "hero";
  valueFormat?: "number" | "currency";
  className?: string;
  testId?: string;
};

function smoothLinePath(coords: readonly { x: number; y: number }[]): string {
  if (coords.length < 2) return "";
  const first = coords[0]!;
  let path = `M ${first.x},${first.y}`;
  for (let i = 0; i < coords.length - 1; i++) {
    const p0 = coords[i]!;
    const p1 = coords[i + 1]!;
    const cx = (p0.x + p1.x) / 2;
    path += ` C ${cx},${p0.y} ${cx},${p1.y} ${p1.x},${p1.y}`;
  }
  return path;
}

function formatAxisValue(value: number, format: "number" | "currency"): string {
  if (format === "currency") {
    if (value >= 1000) return `€${Math.round(value / 1000)}k`;
    return `€${Math.round(value)}`;
  }
  return String(Math.round(value));
}

export default function PgTrendChart({
  points,
  label,
  height = 120,
  colorVar = "var(--pg-color-accent)",
  areaFillVar,
  animate = false,
  endpointGlow = false,
  variant = "default",
  valueFormat = "number",
  className,
  testId,
}: PgTrendChartProps) {
  if (points.length < 2) return null;

  const isHero = variant === "hero";
  const width = 640;
  const padX = isHero ? 32 : 0;
  const padY = isHero ? 22 : 10;
  const chartWidth = width - padX * 2;
  const values = points.map((p) => p.value);
  const max = Math.max(...values);
  const min = Math.min(...values);
  const span = max - min || 1;

  const coords = points.map((point, index) => {
    const x = padX + (index / (points.length - 1)) * chartWidth;
    const y = padY + (1 - (point.value - min) / span) * (height - padY * 2);
    return { x, y };
  });

  const line = isHero ? smoothLinePath(coords) : coords.map((c, i) => `${i === 0 ? "M" : "L"}${c.x},${c.y}`).join(" ");
  const area = `${line} L${padX + chartWidth},${height - 4} L${padX},${height - 4} Z`;
  const last = coords[coords.length - 1]!;
  const gridRatios = isHero ? [0.25, 0.5, 0.75] : [0.25, 0.5, 0.75];
  const strokeWidth = isHero ? 1.25 : 1.5;

  const xLabelIndices =
    points.length <= 3
      ? points.map((_, i) => i)
      : [0, Math.floor((points.length - 1) / 2), points.length - 1];

  return (
    <figure
      className={cn("m-0", isHero && "pg-ds-chart-hero", className)}
      data-testid={testId}
    >
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        className="block h-[var(--pg-trend-height,120px)] w-full"
        role="img"
        aria-label={`${label}: ${points.length} points, ending at ${values[values.length - 1] ?? 0}`}
      >
        <g className="pg-ds-chart-grid">
          {gridRatios.map((ratio) => (
            <line
              key={ratio}
              x1={padX}
              x2={padX + chartWidth}
              y1={padY + ratio * (height - padY * 2)}
              y2={padY + ratio * (height - padY * 2)}
              stroke="var(--pg-color-divider)"
              strokeWidth={1}
              vectorEffect="non-scaling-stroke"
              opacity={isHero ? 0.4 : 0.35}
            />
          ))}
        </g>

        {isHero
          ? [max, min].map((tickValue, index) => {
              const y = index === 0 ? padY + 4 : height - padY;
              return (
                <text
                  key={tickValue}
                  x={padX - 6}
                  y={y}
                  textAnchor="end"
                  className="pg-ds-chart-axis-label"
                  dominantBaseline={index === 0 ? "hanging" : "auto"}
                >
                  {formatAxisValue(tickValue, valueFormat)}
                </text>
              );
            })
          : null}

        {isHero
          ? xLabelIndices.map((pointIndex) => {
              const point = points[pointIndex]!;
              const coord = coords[pointIndex]!;
              return (
                <text
                  key={point.at}
                  x={coord.x}
                  y={height - 2}
                  textAnchor="middle"
                  className="pg-ds-chart-axis-label"
                >
                  {point.at}
                </text>
              );
            })
          : null}

        <path d={area} fill={areaFillVar ?? colorVar} className="pg-ds-chart-area" />
        <path
          d={line}
          fill="none"
          stroke={colorVar}
          strokeWidth={strokeWidth}
          vectorEffect="non-scaling-stroke"
          strokeLinejoin="round"
          strokeLinecap="round"
          className={cn(
            "pg-ds-chart-line",
            animate && "pg-ds-chart-line--animate"
          )}
        />

        {endpointGlow ? (
          <circle
            cx={last.x}
            cy={last.y}
            r={isHero ? 5 : 6}
            fill={colorVar}
            className="pg-ds-chart-endpoint-glow"
            opacity={isHero ? 0.12 : 0.35}
          />
        ) : null}

        <circle
          cx={last.x}
          cy={last.y}
          r={isHero ? 2.5 : 3}
          fill={colorVar}
          className="pg-ds-chart-endpoint"
        />
      </svg>
    </figure>
  );
}
