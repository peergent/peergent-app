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
    <div className="pg-user-footer-card rounded-2xl p-4">
      <div className="flex items-center gap-3">
        <Avatar
          name={account.fullName}
          size="sm"
          gradient="from-violet-500 to-indigo-600"
        />
        <div className="min-w-0 flex-1">
          <p className="pg-user-footer-name truncate text-sm font-medium">
            {account.fullName}
          </p>
          <p className="pg-user-footer-org truncate text-xs">
            {account.organization?.name ?? "Your organization"}
          </p>
        </div>
      </div>

      <form action={signOut} className="mt-4">
        <button
          type="submit"
          className="pg-user-footer-logout pg-focus-premium flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm transition"
        >
          <LogOut size={16} aria-hidden />
          Logout
        </button>
      </form>
    </div>
  );
}
