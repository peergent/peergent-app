"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { getUserAccount } from "@/lib/organizations/queries";
import type { UserAccount } from "@/lib/organizations/types";
import { createClient } from "@/lib/supabase/client";

type AccountContextValue = {
  account: UserAccount | null;
  organizationId: string | null;
  loading: boolean;
  refresh: () => Promise<void>;
};

const AccountContext = createContext<AccountContextValue | null>(null);

export function AccountProvider({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState<UserAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = useMemo(() => createClient(), []);

  const refresh = useCallback(async () => {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setAccount(null);
      setLoading(false);
      return;
    }

    const nextAccount = await getUserAccount(
      supabase,
      user.id,
      user.email ?? ""
    );
    setAccount(nextAccount);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    void refresh();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void refresh();
    });

    return () => subscription.unsubscribe();
  }, [refresh, supabase]);

  const value = useMemo(
    () => ({
      account,
      organizationId: account?.organization?.id ?? null,
      loading,
      refresh,
    }),
    [account, loading, refresh]
  );

  return (
    <AccountContext.Provider value={value}>{children}</AccountContext.Provider>
  );
}

export function useAccount() {
  const context = useContext(AccountContext);
  if (!context) {
    throw new Error("useAccount must be used within AccountProvider.");
  }
  return context;
}
