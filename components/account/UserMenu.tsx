"use client";

import Avatar from "@/components/ui/Avatar";
import type { UserAccount } from "@/lib/organizations/types";
import { signOut } from "@/lib/auth/actions";
import { LogOut } from "lucide-react";

type UserMenuProps = {
  account: UserAccount;
};

export default function UserMenu({ account }: UserMenuProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="flex items-center gap-3">
        <Avatar
          name={account.fullName}
          size="sm"
          gradient="from-violet-500 to-indigo-600"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-white">
            {account.fullName}
          </p>
          <p className="truncate text-xs text-slate-500">
            {account.organization?.name ?? "Your organization"}
          </p>
        </div>
      </div>

      <form action={signOut} className="mt-4">
        <button
          type="submit"
          className="pg-focus-premium flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm text-slate-400 transition hover:bg-white/[0.04] hover:text-white"
        >
          <LogOut size={16} aria-hidden />
          Logout
        </button>
      </form>
    </div>
  );
}
