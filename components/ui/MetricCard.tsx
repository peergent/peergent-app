import type { ReactNode } from "react";
import Card from "@/components/ui/Card";
import { cn } from "@/lib/ui/cn";

export type MetricCardProps = {
  label: string;
  value: ReactNode;
  hint?: string;
  trend?: {
    label: string;
    tone?: "positive" | "neutral" | "negative";
  };
  className?: string;
};

const trendStyles = {
  positive: "text-emerald-400",
  neutral: "text-slate-400",
  negative: "text-red-400",
};

export default function MetricCard({
  label,
  value,
  hint,
  trend,
  className,
}: MetricCardProps) {
  return (
    <Card className={cn("space-y-4", className)} padding="md">
      <p className="text-sm text-slate-400">{label}</p>
      <p className="text-3xl font-semibold tracking-tight text-white">{value}</p>
      {trend && (
        <p className={cn("text-sm", trendStyles[trend.tone ?? "neutral"])}>
          {trend.label}
        </p>
      )}
      {hint && !trend && <p className="text-sm text-slate-500">{hint}</p>}
    </Card>
  );
}
