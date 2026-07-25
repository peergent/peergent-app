"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";

export type AttentionFigmaRow = {
  id: string;
  title: string;
  subtitle: string;
  href: string;
  urgent?: boolean;
};

export type AttentionFigmaProps = {
  title?: string;
  items: AttentionFigmaRow[];
  viewAllHref?: string;
  viewAllLabel?: string;
  className?: string;
};

export default function AttentionFigma({
  title = "Needs your attention",
  items,
  viewAllHref,
  viewAllLabel = "View all",
  className,
}: AttentionFigmaProps) {
  if (items.length === 0) return null;

  return (
    <section className={className} aria-label={title}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 12,
          gap: 12,
        }}
      >
        <p className="hf-section-label">{title}</p>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span
            style={{
              fontSize: 10,
              fontWeight: 600,
              color: "var(--hf-muted-foreground)",
              background: "rgba(255,255,255,0.06)",
              borderRadius: 999,
              padding: "2px 8px",
            }}
          >
            {items.length}
          </span>
          {viewAllHref && (
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
      </div>

      <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
        {items.map((item) => (
          <li key={item.id}>
            <Link href={item.href} className="hf-attention-row pg-focus-premium">
              <span style={{ flex: 1, minWidth: 0 }}>
                <span
                  style={{
                    display: "block",
                    fontSize: 13,
                    fontWeight: 500,
                    lineHeight: 1.3,
                    color: "var(--hf-foreground)",
                    letterSpacing: "-0.01em",
                  }}
                >
                  {item.title}
                </span>
                {item.subtitle && (
                  <span
                    style={{
                      display: "block",
                      marginTop: 2,
                      fontSize: 11,
                      color: "var(--hf-muted-foreground)",
                      opacity: 0.85,
                    }}
                  >
                    {item.subtitle}
                  </span>
                )}
              </span>
              <ChevronRight size={14} style={{ opacity: 0.45, flexShrink: 0 }} aria-hidden />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
