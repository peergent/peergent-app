"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight, Home, LayoutDashboard } from "lucide-react";
import { useAccount } from "@/components/account/AccountProvider";
import V17CompactThemeToggle from "@/features/customer-v17/components/V17CompactThemeToggle";
import { createClient } from "@/lib/supabase/client";
import { fetchOrganizationPeers } from "@/lib/peers/queries";
import {
  canonicalCustomerPeerLabel,
  customerPeerRoleBucket,
  selectCanonicalCustomerPeers,
} from "@/lib/customer-v17/select-canonical-customer-peers";
import type { PeerRow } from "@/lib/peer-display";
import { getV17CommandCenterCopy } from "@/lib/i18n/v17-command-center-copy";
import { customerLocalePreferenceFromEnv } from "@/lib/i18n/resolve-customer-locale-preference";
import { v17PeerAccentClass, v17ServiceKeyFromPeer } from "@/lib/customer-v17/peer-accent";
import V17Atmosphere from "./V17Atmosphere";
import "../styles/v17-customer.css";

function peerInitial(name: string): string {
  return name.trim().charAt(0).toUpperCase() || "?";
}

function isCommandCenter(pathname: string) {
  return pathname === "/home" || pathname === "/dashboard" || pathname.startsWith("/home/");
}

function isHq(pathname: string) {
  return pathname === "/hq" || pathname.startsWith("/hq/");
}

function isPeerPath(pathname: string, peerId: string) {
  return pathname === `/team/${peerId}` || pathname.startsWith(`/team/${peerId}/`);
}

export type V17CustomerShellProps = {
  children: ReactNode;
};

export default function V17CustomerShell({ children }: V17CustomerShellProps) {
  const pathname = usePathname();
  const { organizationId } = useAccount();
  const [collapsed, setCollapsed] = useState(false);
  const [peers, setPeers] = useState<PeerRow[]>([]);
  const localePreference = customerLocalePreferenceFromEnv();
  const copy = getV17CommandCenterCopy(localePreference);
  const localeTag = localePreference === "en" ? "en" : "nl";

  const loadPeers = useCallback(async () => {
    if (!organizationId) {
      setPeers([]);
      return;
    }
    try {
      const supabase = createClient();
      const rows = await fetchOrganizationPeers(supabase, organizationId);
      setPeers(selectCanonicalCustomerPeers(rows));
    } catch {
      setPeers([]);
    }
  }, [organizationId]);

  useEffect(() => {
    void loadPeers();
  }, [loadPeers]);

  return (
    <div className="pg-v17">
      <V17Atmosphere />
      <div className="v17-mobile-bar">
        <Link href="/hq" className="v17-btn v17-btn--ghost pg-focus-premium">
          {copy.navHq}
        </Link>
        <Link href="/home" className="v17-btn v17-btn--ghost pg-focus-premium">
          {copy.navCommandCenter}
        </Link>
      </div>
      <div className="v17-app">
        <aside
          className={`v17-rail${collapsed ? " v17-rail--collapsed" : ""}`}
          aria-label="Customer navigation"
        >
          <button
            type="button"
            className="v17-rail-collapse pg-focus-premium"
            onClick={() => setCollapsed((v) => !v)}
            aria-label={collapsed ? "Expand navigation" : "Collapse navigation"}
          >
            {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
          <div className="v17-brand">
            <LayoutDashboard size={22} aria-hidden />
            <span className="v17-brand-word">Peergent</span>
          </div>
          <nav>
            <Link
              href="/hq"
              className={`v17-nav-item pg-focus-premium${isHq(pathname) ? " v17-nav-item--active" : ""}`}
            >
              <Home size={18} aria-hidden />
              <span className="v17-nav-label">{copy.navHq}</span>
            </Link>
            <Link
              href="/home"
              className={`v17-nav-item pg-focus-premium${isCommandCenter(pathname) ? " v17-nav-item--active" : ""}`}
              aria-current={isCommandCenter(pathname) ? "page" : undefined}
            >
              <LayoutDashboard size={18} aria-hidden />
              <span className="v17-nav-label">{copy.navCommandCenter}</span>
            </Link>
          </nav>
          {peers.length > 0 ? (
            <div>
              <p className="v17-rail-group-label">{copy.navPeers}</p>
              {peers.map((peer) => {
                const serviceKey = v17ServiceKeyFromPeer({ role: peer.role, name: peer.name });
                const active = isPeerPath(pathname, peer.id);
                return (
                  <Link
                    key={peer.id}
                    href={`/team/${peer.id}`}
                    className={`v17-nav-item pg-focus-premium${active ? " v17-nav-item--active" : ""} ${v17PeerAccentClass(serviceKey)}`}
                    aria-current={active ? "page" : undefined}
                    style={{ ["--v17-peer-solid" as string]: undefined }}
                  >
                    <span className="v17-peer-ring" aria-hidden>
                      {peerInitial(peer.name)}
                    </span>
                    <span className="v17-nav-label">
                      {(() => {
                        const bucket = customerPeerRoleBucket(peer.role);
                        return bucket !== "Custom"
                          ? canonicalCustomerPeerLabel(bucket, localeTag)
                          : peer.name;
                      })()}
                    </span>
                  </Link>
                );
              })}
            </div>
          ) : null}
          <div className="v17-rail-foot">
            <V17CompactThemeToggle />
          </div>
        </aside>
        <div className="v17-main">{children}</div>
      </div>
    </div>
  );
}
