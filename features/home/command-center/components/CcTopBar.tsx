"use client";

import Link from "next/link";
import { useAccount } from "@/components/account/AccountProvider";
import { CcBrandMark } from "./CcBrandMark";
import { CcStatusPill } from "./CcStatusPill";

export function CcTopBar() {
  const { account } = useAccount();
  const initial = (account?.fullName?.trim()?.[0] ?? account?.email?.[0] ?? "U").toUpperCase();

  return (
    <header className="command-center__topbar">
      <div className="command-center__brand-nav">
        <Link href="/hq" className="command-center__back-btn pg-focus-premium" aria-label="Back to HQ">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </Link>
        <Link href="/hq" className="command-center__brand pg-focus-premium">
          <CcBrandMark className="command-center__brand-mark" />
          <div className="command-center__brand-word">PeerGent</div>
        </Link>
        <span className="command-center__crumb-sep" aria-hidden>
          /
        </span>
        <span className="command-center__crumb-current">Command Center</span>
      </div>
      <div className="command-center__topbar-right">
        <CcStatusPill />
        <div className="command-center__avatar" aria-hidden>
          {initial}
        </div>
      </div>
    </header>
  );
}
