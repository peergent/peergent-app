"use client";

import Link from "next/link";
import type React from "react";
import type { HqServiceKey } from "@/lib/hq/hq-service-key";
import { v17PeerAccentClass } from "@/lib/customer-v17/peer-accent";

export function V17LineItem({
  id,
  serviceKey,
  left,
  right,
  href,
}: {
  id: string;
  serviceKey: HqServiceKey;
  left: React.ReactNode;
  right?: React.ReactNode;
  href?: string;
}) {
  const body = (
    <>
      <div className="v17-line-item__l">
        <span className={`v17-dot-peer ${v17PeerAccentClass(serviceKey)}`} aria-hidden />
        <span className="v17-line-item__text">{left}</span>
      </div>
      {right ? <div className="v17-line-item__r">{right}</div> : null}
    </>
  );
  if (href) {
    return (
      <Link href={href} className="v17-line-item pg-focus-premium" data-testid={id}>
        {body}
      </Link>
    );
  }
  return (
    <div className="v17-line-item" data-testid={id}>
      {body}
    </div>
  );
}

export function V17CcBlock({
  title,
  attention,
  children,
}: {
  title: string;
  attention?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className="v17-cc-block">
      <h2 className={`v17-cc-block-head${attention ? " v17-cc-block-head--attn" : ""}`}>{title}</h2>
      {children}
    </section>
  );
}
