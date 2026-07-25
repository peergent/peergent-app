"use client";

import Link from "next/link";

export type ActivityFigmaRow = {
  id: string;
  title: string;
  desc: string;
  timeLabel: string;
  href: string;
  color: string;
  emphasis: boolean;
  opacity: number;
};

export type RecentActivityFigmaProps = {
  title?: string;
  items: ActivityFigmaRow[];
  viewAllHref?: string;
  viewAllLabel?: string;
  emptyMessage?: string;
  className?: string;
};

export default function RecentActivityFigma({
  title = "Recent Activity",
  items,
  viewAllHref,
  viewAllLabel = "View all",
  emptyMessage,
  className,
}: RecentActivityFigmaProps) {
  return (
    <section className={className} aria-label={title}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 12,
        }}
      >
        <p className="hf-section-label">{title}</p>
        {viewAllHref && items.length > 0 && (
          <Link
            href={viewAllHref}
            className="pg-focus-premium"
            style={{
              fontSize: 10.5,
              color: "var(--hf-muted-foreground)",
              fontWeight: 400,
              opacity: 0.6,
            }}
          >
            {viewAllLabel}
          </Link>
        )}
      </div>

      {items.length === 0 ? (
        emptyMessage && (
          <p style={{ fontSize: 12, color: "var(--hf-muted-foreground)", lineHeight: 1.6 }}>{emptyMessage}</p>
        )
      ) : (
        <div
          className="hf-scrollbar-thin"
          style={{ maxHeight: 310, overflowY: "auto", display: "flex", flexDirection: "column", gap: 0 }}
        >
          {items.map((a, i) => (
            <Link
              key={a.id}
              href={a.href}
              className="hf-activity-item pg-focus-premium"
              style={{
                display: "flex",
                gap: 10,
                padding: "7px 4px",
                borderBottom: i < items.length - 1 ? "1px solid var(--hf-border)" : "none",
                opacity: a.opacity,
                textDecoration: "none",
                color: "inherit",
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  flexShrink: 0,
                  paddingTop: 4,
                }}
              >
                <div
                  style={{
                    width: a.emphasis ? 5 : 4,
                    height: a.emphasis ? 5 : 4,
                    borderRadius: "50%",
                    background: a.color,
                    flexShrink: 0,
                    opacity: a.emphasis ? 1 : 0.7,
                  }}
                />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p
                  style={{
                    fontSize: a.emphasis ? 12 : 11,
                    fontWeight: a.emphasis ? 500 : 400,
                    color: a.emphasis ? "var(--hf-foreground)" : "var(--hf-muted-foreground)",
                    lineHeight: 1.3,
                    marginBottom: 2,
                  }}
                >
                  {a.title}
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <p
                    style={{
                      fontSize: 10,
                      color: "var(--hf-muted-foreground)",
                      fontWeight: 400,
                      opacity: 0.65,
                    }}
                  >
                    {a.desc}
                  </p>
                  <span
                    style={{
                      width: 2,
                      height: 2,
                      borderRadius: "50%",
                      background: "var(--hf-muted-foreground)",
                      opacity: 0.3,
                      flexShrink: 0,
                    }}
                    aria-hidden
                  />
                  <time style={{ fontSize: 10, color: "var(--hf-muted-foreground)", fontWeight: 400, opacity: 0.5 }}>
                    {a.timeLabel}
                  </time>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
