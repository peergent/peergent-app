"use client";

import Link from "next/link";
import { RefreshCw } from "lucide-react";
import { PgAppShell, PgButton, PgInboxList } from "@/components/design-system";
import { useInboxPage } from "@/hooks/useInboxPage";
import { cn } from "@/lib/ui/cn";

export default function InboxPage() {
  const { pageState, errorMessage, viewModel, copy, retry, inboxCount } = useInboxPage();

  return (
    <main className="min-h-screen bg-[var(--pg-color-canvas)] text-[var(--pg-color-text-primary)]">
      <PgAppShell inboxCount={inboxCount}>
        <section className="min-w-0 flex-1 px-5 py-6 md:px-8 md:py-10 lg:px-10">
          <header className="mx-auto max-w-[var(--pg-container-narrow)]">
            <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">{copy.pageTitle}</h1>
            <p className="mt-2 text-sm text-[var(--pg-color-text-secondary)]">{copy.pageDescription}</p>
            {viewModel && !viewModel.isEmpty && (
              <p
                className="mt-4 text-xs font-medium uppercase tracking-wider text-[var(--pg-color-text-tertiary)]"
                aria-live="polite"
              >
                {copy.itemCount(viewModel.items.length)}
              </p>
            )}
          </header>

          {pageState === "loading" && (
            <div
              className="mx-auto mt-10 max-w-[var(--pg-container-narrow)] space-y-3"
              aria-busy
              aria-label={copy.loadingLabel}
            >
              {[1, 2, 3].map((row) => (
                <div
                  key={row}
                  className="h-14 animate-pulse rounded-[var(--pg-radius-lg)] bg-white/[0.04]"
                />
              ))}
            </div>
          )}

          {pageState === "error" && (
            <div className="mx-auto mt-16 flex max-w-md flex-col items-center text-center">
              <p className="text-lg font-medium">{copy.errorTitle}</p>
              <p className="mt-2 text-sm text-[var(--pg-color-text-secondary)]">{errorMessage}</p>
              <PgButton variant="ghost" className="mt-8" onClick={retry} leftIcon={<RefreshCw size={16} />}>
                {copy.errorRetry}
              </PgButton>
            </div>
          )}

          {pageState === "success" && viewModel?.isEmpty && (
            <div
              className={cn(
                "mx-auto mt-16 flex max-w-md flex-col items-center text-center",
                "pg-section-enter"
              )}
              aria-live="polite"
            >
              <p className="text-xl font-semibold tracking-tight">{copy.emptyTitle}</p>
              <p className="mt-3 text-sm leading-relaxed text-[var(--pg-color-text-secondary)]">
                {copy.emptyBody}
              </p>
              <Link
                href="/home"
                className="pg-focus-premium mt-8 inline-flex min-h-11 items-center justify-center rounded-[var(--pg-radius-md)] border border-[var(--pg-color-border)] px-5 text-sm font-medium text-[var(--pg-color-text-primary)] transition hover:bg-[var(--pg-color-accent-muted)]"
              >
                {copy.emptyCta}
              </Link>
            </div>
          )}

          {pageState === "success" && viewModel && !viewModel.isEmpty && (
            <div className="mx-auto mt-8 max-w-[var(--pg-container-narrow)]">
              <PgInboxList items={viewModel.items} />
            </div>
          )}
        </section>
      </PgAppShell>
    </main>
  );
}
