"use client";

import Link from "next/link";

export default function BriefingNotification() {
  return (
    <div className="hq-landing__briefing-wrap">
      <Link href="/home" className="hq-landing__briefing pg-focus-premium" aria-label="Open briefing in Command Center">
        <div className="hq-landing__briefing-head">
          <div className="hq-landing__briefing-icon" aria-hidden />
          <div className="hq-landing__briefing-app">PeerGent</div>
          <div className="hq-landing__briefing-time">now</div>
        </div>
        <div className="hq-landing__briefing-title">Your briefing is ready</div>
        <div className="hq-landing__briefing-sub">See what happened overnight.</div>
        <div className="hq-landing__briefing-cta">Open briefing →</div>
      </Link>
    </div>
  );
}
