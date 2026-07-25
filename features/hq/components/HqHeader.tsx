"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PeergentLogoMark } from "./hq-icons";

export type HqHeaderProps = {
  profileInitial: string;
};

function formatWorkforceClock(date: Date): string {
  const h = String(date.getHours()).padStart(2, "0");
  const m = String(date.getMinutes()).padStart(2, "0");
  return `Workforce active · ${h}:${m}`;
}

export default function HqHeader({ profileInitial }: HqHeaderProps) {
  const [clockLabel, setClockLabel] = useState("Workforce active");

  useEffect(() => {
    const tick = () => setClockLabel(formatWorkforceClock(new Date()));
    tick();
    const id = window.setInterval(tick, 15000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <header className="hq-landing__topbar">
      <Link href="/hq" className="hq-landing__brand pg-focus-premium">
        <PeergentLogoMark className="hq-landing__brand-mark" />
        <span className="hq-landing__brand-word">PeerGent</span>
      </Link>
      <div className="hq-landing__topbar-right">
        <div className="hq-landing__status-pill">
          <span className="hq-landing__live-dot" aria-hidden />
          <span>{clockLabel}</span>
        </div>
        <Link href="/settings" className="hq-landing__avatar pg-focus-premium" aria-label="Profile settings">
          {profileInitial}
        </Link>
      </div>
    </header>
  );
}
