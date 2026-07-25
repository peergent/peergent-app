"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import UserMenu from "@/components/account/UserMenu";
import { useAccount } from "@/components/account/AccountProvider";
import {
  BarChart3,
  BookOpen,
  Home,
  MessageSquare,
  Plug,
  Settings,
  Users,
} from "lucide-react";

type SidebarItemProps = {
  href: string;
  icon: ReactNode;
  title: string;
  active?: boolean;
  badge?: number;
};

type SidebarSoonProps = {
  icon: ReactNode;
  title: string;
  badge?: number;
};

export default function Sidebar() {
  const pathname = usePathname();
  const { account, loading } = useAccount();

  function isActive(href: string) {
    if (href === "/home") {
      return pathname === "/home" || pathname === "/dashboard";
    }

    if (href === "/peers") {
      return pathname === "/peers" || pathname.startsWith("/peers/");
    }

    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <aside className="sidebar-refined hidden min-h-screen w-[248px] shrink-0 flex-col border-r border-white/[0.06] bg-[#080b12] px-5 py-6 lg:flex">
      <div className="mb-8 flex items-center gap-3 px-1">
        <Image
          src="/images/logo.png"
          alt="Peergent logo"
          width={40}
          height={40}
          className="h-10 w-10 object-contain"
          priority
        />

        <div>
          <p className="text-[17px] font-semibold text-white">Peergent</p>
          <p className="text-[11px] text-slate-500">AI Workforce</p>
        </div>
      </div>

      <nav className="space-y-1">
        <SidebarItem
          href="/home"
          icon={<Home size={18} strokeWidth={1.75} />}
          title="Command Center"
          active={isActive("/home")}
        />

        <SidebarItem
          href="/peers"
          icon={<Users size={18} strokeWidth={1.75} />}
          title="AI Team"
          active={isActive("/peers")}
        />

        <SidebarItem
          href="/knowledge"
          icon={<BookOpen size={18} strokeWidth={1.75} />}
          title="Knowledge"
          active={isActive("/knowledge")}
        />

        <SidebarItem
          href="/integrations"
          icon={<Plug size={18} strokeWidth={1.75} />}
          title="Integrations"
          active={isActive("/integrations")}
        />

        <SidebarSoon icon={<MessageSquare size={18} strokeWidth={1.75} />} title="Conversations" badge={2} />
        <SidebarSoon icon={<BarChart3 size={18} strokeWidth={1.75} />} title="Analytics" />
        <SidebarItem
          href="/settings"
          icon={<Settings size={18} strokeWidth={1.75} />}
          title="Settings"
          active={isActive("/settings")}
        />
      </nav>

      <div className="mt-auto space-y-3 pt-6">
        {loading ? (
          <div className="h-24 animate-pulse rounded-2xl bg-white/[0.04]" />
        ) : account ? (
          <UserMenu account={account} />
        ) : null}

        <div className="rounded-[14px] border border-white/[0.06] bg-white/[0.02] p-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-violet-400/90">
            Pro plan
          </p>

          <p className="mt-2 text-sm text-slate-400">4 of 20 peers active</p>

          <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/[0.08]">
            <div className="h-full w-1/5 rounded-full bg-gradient-to-r from-violet-500 to-indigo-500" />
          </div>
        </div>
      </div>
    </aside>
  );
}

function SidebarItem({
  href,
  icon,
  title,
  active = false,
  badge,
}: SidebarItemProps) {
  return (
    <Link
      href={href}
      className={`flex w-full items-center gap-3 rounded-[10px] px-3 py-2.5 text-left text-[14px] transition focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50 ${
        active
          ? "bg-violet-500/12 text-white"
          : "text-slate-400 hover:bg-white/[0.04] hover:text-slate-200"
      }`}
    >
      {icon}
      <span className="flex-1">{title}</span>
      {badge !== undefined && (
        <span className="rounded-full bg-white/[0.08] px-1.5 py-0.5 text-[10px] font-medium text-slate-400">
          {badge}
        </span>
      )}
    </Link>
  );
}

function SidebarSoon({ icon, title, badge }: SidebarSoonProps) {
  return (
    <div
      className="flex w-full cursor-not-allowed items-center gap-3 rounded-[10px] px-3 py-2.5 text-left text-[14px] text-slate-600"
      aria-disabled="true"
      title="Coming soon"
    >
      {icon}
      <span className="flex-1">{title}</span>
      {badge !== undefined ? (
        <span className="rounded-full bg-white/[0.06] px-1.5 py-0.5 text-[10px] font-medium text-slate-500">
          {badge}
        </span>
      ) : (
        <span className="text-[10px] font-medium uppercase tracking-wider text-slate-700">
          Soon
        </span>
      )}
    </div>
  );
}
