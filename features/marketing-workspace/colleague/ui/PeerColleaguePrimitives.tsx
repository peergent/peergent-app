"use client";

import Link from "next/link";
import type { ReactNode } from "react";

export type SectionActionProps = {
  href: string;
  label: string;
  variant?: "primary" | "secondary";
};

export function SectionAction({ href, label, variant = "primary" }: SectionActionProps) {
  return (
    <Link
      href={href}
      className={`mw-cc-action mw-cc-action--${variant} pg-focus-premium`}
    >
      {label}
    </Link>
  );
}

export type PeerColleagueSectionProps = {
  purpose?: string;
  children: ReactNode;
  testId?: string;
};

export function PeerColleagueSection({ purpose, children, testId }: PeerColleagueSectionProps) {
  return (
    <div className="mw-cc-section" data-testid={testId}>
      {purpose ? <p className="mw-cc-section-purpose">{purpose}</p> : null}
      <div className="mw-cc-section-body">{children}</div>
    </div>
  );
}
