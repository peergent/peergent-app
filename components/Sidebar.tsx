"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import {
  BarChart3,
  BookOpen,
  Bot,
  LayoutDashboard,
  MessageSquare,
  Settings,
} from "lucide-react";

type SidebarItemProps = {
  href: string;
  icon: ReactNode;
  title: string;
  active?: boolean;
};

export default function Sidebar() {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/") {
      return pathname === "/";
    }

    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <aside className="hidden min-h-screen w-64 shrink-0 flex-col border-r border-white/10 bg-[#070b18] p-6 lg:flex">
      <div className="mb-10 flex items-center gap-3">
        <Image
          src="/images/logo.png"
          alt="Peergent logo"
          width={42}
          height={42}
          className="h-11 w-11 object-contain"
          priority
        />

        <div>
          <p className="text-xl font-semibold text-white">Peergent</p>
          <p className="text-xs text-slate-500">AI Workforce</p>
        </div>
      </div>

      <nav className="space-y-2">
        <SidebarItem
          href="/"
          icon={<LayoutDashboard size={19} />}
          title="Overview"
          active={isActive("/")}
        />

        <SidebarItem
          href="/peers"
          icon={<Bot size={19} />}
          title="AI Peers"
          active={isActive("/peers")}
        />

        <SidebarItem
          href="/conversations"
          icon={<MessageSquare size={19} />}
          title="Conversations"
          active={isActive("/conversations")}
        />

        <SidebarItem
          href="/knowledge"
          icon={<BookOpen size={19} />}
          title="Knowledge"
          active={isActive("/knowledge")}
        />

        <SidebarItem
          href="/analytics"
          icon={<BarChart3 size={19} />}
          title="Analytics"
          active={isActive("/analytics")}
        />

        <SidebarItem
          href="/settings"
          icon={<Settings size={19} />}
          title="Settings"
          active={isActive("/settings")}
        />
      </nav>

      <div className="mt-auto rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <p className="text-xs uppercase tracking-wider text-violet-400">
          Pro plan
        </p>

        <p className="mt-2 text-sm text-slate-400">4 of 20 peers active</p>

        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/10">
          <div className="h-full w-1/5 rounded-full bg-gradient-to-r from-blue-500 to-violet-500" />
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
}: SidebarItemProps) {
  return (
    <Link
      href={href}
      className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 ${
        active
          ? "bg-violet-500/15 text-white"
          : "text-slate-400 hover:bg-white/5 hover:text-white"
      }`}
    >
      {icon}
      <span>{title}</span>
    </Link>
  );
}
