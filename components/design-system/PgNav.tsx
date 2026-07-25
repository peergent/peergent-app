"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { BookOpen, Home, Inbox, Users } from "lucide-react";
import { cn } from "@/lib/ui/cn";

type NavItem = {
  href: string;
  icon: ReactNode;
  label: string;
  badge?: number;
};

export type PgNavProps = {
  inboxCount?: number;
  className?: string;
  variant?: "default" | "figma";
};

function isNavActive(pathname: string, href: string): boolean {
  if (href === "/home") {
    return pathname === "/home" || pathname === "/dashboard";
  }
  if (href === "/hq") {
    return pathname === "/hq";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function PgNav({ inboxCount = 0, className, variant = "default" }: PgNavProps) {
  const pathname = usePathname();
  const isFigma = variant === "figma";

  const items: NavItem[] = [
    { href: "/home", icon: <Home size={14} strokeWidth={1.75} />, label: "Command Center" },
    {
      href: "/inbox",
      icon: <Inbox size={14} strokeWidth={1.75} />,
      label: "Inbox",
      badge: inboxCount > 0 ? inboxCount : undefined,
    },
    { href: "/team", icon: <Users size={14} strokeWidth={1.75} />, label: "Team" },
    { href: "/company", icon: <BookOpen size={14} strokeWidth={1.75} />, label: "Company" },
  ];

  return (
    <aside
      className={cn(
        "pg-nav hidden min-h-screen w-[var(--pg-nav-width)] shrink-0 flex-col border-r lg:flex",
        isFigma
          ? "pg-nav-figma border-[rgba(123,111,255,0.09)] bg-[#060718] px-2 py-5"
          : "border-[var(--pg-color-border-subtle)] bg-[var(--pg-sidebar-bg)] px-3 py-5",
        className
      )}
    >
      <div
        className={cn(
          "mb-6 shrink-0 px-2 pb-5 pt-1",
          isFigma ? "border-b border-[rgba(123,111,255,0.09)]" : "border-b border-[var(--pg-color-border-subtle)]"
        )}
      >
        <div className="flex items-center gap-2.5">
          <Image
            src="/images/logo.png"
            alt="Peergent"
            width={24}
            height={24}
            className="h-6 w-6 object-contain"
            priority
          />
          <div className="min-w-0">
            <p
              className={cn(
                "text-[14px] font-bold tracking-[-0.025em]",
                isFigma ? "text-[#EEEEFF]" : "text-[var(--pg-color-text-primary)]"
              )}
            >
              Peergent
            </p>
            <p
              className={cn(
                "text-[10px] font-normal",
                isFigma ? "text-[#8890B8]" : "text-[var(--pg-color-text-tertiary)]"
              )}
            >
              AI colleagues. Real results.
            </p>
          </div>
        </div>
      </div>

      {isFigma && (
        <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#8890B8] opacity-55">
          Workspace
        </p>
      )}

      <nav className={cn("flex flex-1 flex-col gap-0.5", isFigma ? "px-1" : "px-1")} aria-label="Main">
        {items.map((item) => {
          const active = isNavActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "pg-nav-item pg-focus-premium flex w-full items-center gap-2 text-left transition duration-150",
                isFigma
                  ? cn("hf-nav-top min-h-[36px] rounded-[7px] px-2 py-1.5 text-[12px]", active && "active")
                  : cn(
                      "min-h-[40px] rounded-[10px] px-3 py-2 text-[12.5px]",
                      active
                        ? "bg-[rgba(139,124,246,0.13)] font-semibold text-[var(--pg-color-text-primary)] shadow-[inset_0_0_0_1px_rgba(139,124,246,0.14)]"
                        : "font-medium text-[var(--pg-color-text-secondary)] hover:bg-white/[0.04] hover:text-[var(--pg-color-text-primary)]"
                    )
              )}
            >
              <span
                className={cn(
                  "shrink-0",
                  isFigma
                    ? active
                      ? "text-[#7B6FFF]"
                      : "opacity-80"
                    : active
                      ? "text-[var(--pg-color-accent)]"
                      : "opacity-75"
                )}
              >
                {item.icon}
              </span>
              <span className="flex-1">{item.label}</span>
              {item.badge !== undefined && (
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums",
                    item.href === "/inbox"
                      ? isFigma
                        ? "bg-[rgba(245,158,11,0.15)] text-[#FBBF24]"
                        : "bg-[var(--pg-color-warning-muted)] text-[var(--pg-color-warning)]"
                      : isFigma
                        ? "bg-white/[0.08] text-[#8890B8]"
                        : "bg-white/[0.08] text-[var(--pg-color-text-tertiary)]"
                  )}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

export { isNavActive };
