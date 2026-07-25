"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Home, Inbox, Users } from "lucide-react";
import UserMenu from "@/components/account/UserMenu";
import { useAccount } from "@/components/account/AccountProvider";
import PgNav, { isNavActive } from "@/components/design-system/PgNav";
import { cn } from "@/lib/ui/cn";

export type PgAppShellProps = {
  children: ReactNode;
  inboxCount?: number;
  className?: string;
  contentClassName?: string;
  navVariant?: "default" | "figma";
};

/**
 * 2.0 app chrome — Home · Inbox · Team · Company.
 * Settings live in UserMenu only.
 */
export default function PgAppShell({
  children,
  inboxCount = 0,
  className,
  contentClassName,
  navVariant = "default",
}: PgAppShellProps) {
  const { account, loading } = useAccount();
  const pathname = usePathname();
  const isFigma = navVariant === "figma";

  return (
    <div
      className={cn(
        "pg-app-shell relative mx-auto flex min-h-screen max-w-[var(--pg-container-app)]",
        className
      )}
    >
      <div className="hidden shrink-0 lg:flex lg:w-[var(--pg-nav-width)] lg:flex-col">
        <PgNav inboxCount={inboxCount} variant={navVariant} className="min-h-0 flex-1 border-r-0" />
        <div
          className={cn(
            "border-r px-4 pb-6 pt-2",
            isFigma
              ? "border-[var(--pg-border-subtle)] bg-[var(--pg-sidebar-bg)]"
              : "border-[var(--pg-color-border-subtle)] bg-[var(--pg-sidebar-bg)]"
          )}
        >
          {loading ? (
            <div className="h-24 animate-pulse rounded-[var(--pg-radius-lg)] pg-skeleton-subtle" />
          ) : account ? (
            <UserMenu account={account} />
          ) : null}
        </div>
      </div>

      <div className="flex min-w-0 flex-1 flex-col pb-[max(4.75rem,env(safe-area-inset-bottom))] lg:pb-0">
        <div className={cn("min-w-0 flex-1", contentClassName)}>{children}</div>
      </div>

      <div
        className={cn(
          "pg-mobile-nav fixed bottom-0 left-0 right-0 z-30 border-t backdrop-blur-md lg:hidden",
          !isFigma &&
            "pg-mobile-nav border-[var(--pg-color-border-subtle)] bg-[var(--pg-sidebar-bg)]/96 supports-[backdrop-filter]:bg-[var(--pg-sidebar-bg)]/88"
        )}
        style={
          isFigma
            ? {
                borderColor: "var(--pg-border-subtle)",
                background: "color-mix(in srgb, var(--pg-sidebar-bg) 96%, transparent)",
              }
            : undefined
        }
      >
        <nav
          className="mx-auto flex max-w-lg items-stretch justify-around px-1 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-1.5"
          aria-label="Main"
        >
          <MobileNavLink
            href="/home"
            label="Command Center"
            icon={<Home size={18} strokeWidth={1.75} />}
            active={isNavActive(pathname, "/home")}
          />
          <MobileNavLink
            href="/inbox"
            label="Inbox"
            icon={<Inbox size={18} strokeWidth={1.75} />}
            badge={inboxCount > 0 ? inboxCount : undefined}
            active={isNavActive(pathname, "/inbox")}
          />
          <MobileNavLink
            href="/team"
            label="Team"
            icon={<Users size={18} strokeWidth={1.75} />}
            active={isNavActive(pathname, "/team")}
          />
          <MobileNavLink
            href="/company"
            label="Company"
            icon={<BookOpen size={18} strokeWidth={1.75} />}
            active={isNavActive(pathname, "/company")}
          />
        </nav>
      </div>
    </div>
  );
}

function MobileNavLink({
  href,
  label,
  icon,
  badge,
  active,
}: {
  href: string;
  label: string;
  icon: ReactNode;
  badge?: number;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "pg-focus-premium relative flex min-h-[44px] min-w-[44px] flex-1 flex-col items-center justify-center gap-0.5 px-2 py-1 text-[10px] font-medium transition",
        active
          ? "text-[var(--pg-color-accent)]"
          : "text-[var(--pg-color-text-tertiary)] hover:text-[var(--pg-color-text-secondary)]"
      )}
    >
      <span className={cn("flex h-6 items-center justify-center", active && "scale-105")}>{icon}</span>
      {label}
      {badge !== undefined && (
        <span className="absolute right-2 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--pg-color-warning)] px-1 text-[9px] font-semibold text-[var(--pg-color-text-inverse)]">
          {badge}
        </span>
      )}
    </Link>
  );
}
