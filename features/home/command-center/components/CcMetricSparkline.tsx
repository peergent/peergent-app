import { sparkLinePath } from "@/lib/home/cc-chart-paths";

type CcMetricSparklineProps = {
  values: number[];
  color: string;
  width: number;
  height: number;
  muted?: boolean;
};

export function CcMetricSparkline({ values, color, width, height, muted }: CcMetricSparklineProps) {
  const path = sparkLinePath(values, width, height, 3);
  const opacity = muted ? "0.35" : "0.9";
  return (
    <svg className="command-center__metric-spark" viewBox={`0 0 ${width} ${height}`} aria-hidden>
      <path d={path} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" opacity={opacity} />
    </svg>
  );
}

export function CcMiniSparkline({
  values,
  color,
  width,
  height,
}: CcMetricSparklineProps) {
  const path = sparkLinePath(values, width, height, 2);
  return (
    <svg className="command-center__agent-perf-spark" viewBox={`0 0 ${width} ${height}`} aria-hidden>
      <path d={path} fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" opacity="0.9" />
    </svg>
  );
}
