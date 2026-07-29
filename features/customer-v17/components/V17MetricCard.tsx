"use client";

import Link from "next/link";

export type V17MetricCardProps = {
  value: string;
  label: string;
  href?: string | null;
  testId?: string;
};

export default function V17MetricCard({ value, label, href, testId }: V17MetricCardProps) {
  const inner = (
    <>
      <div className="v17-week-num">{value}</div>
      <div className="v17-week-label">{label}</div>
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="v17-week-card v17-week-card--interactive pg-focus-premium"
        aria-label={`${label}: ${value}`}
        data-testid={testId}
      >
        {inner}
      </Link>
    );
  }

  return (
    <div className="v17-week-card" data-testid={testId}>
      {inner}
    </div>
  );
}
