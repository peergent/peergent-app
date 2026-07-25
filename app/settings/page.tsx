"use client";

import { PgAppShell } from "@/components/design-system";
import PgThemeToggle from "@/components/theme/PgThemeToggle";
import PageHeader from "@/components/ui/PageHeader";

export default function SettingsPage() {
  return (
    <main className="min-h-screen bg-[var(--pg-bg)] text-[var(--pg-text)]">
      <PgAppShell>
        <section className="min-w-0 flex-1 p-5 md:p-8 lg:p-10">
          <PageHeader
            eyebrow="Workspace"
            title="Settings"
            description="Organization and account preferences."
          />

          <div className="mt-8 rounded-[var(--pg-radius-xl)] border border-[var(--pg-border-soft)] bg-[var(--pg-surface-solid)] p-8 shadow-[var(--pg-shadow-sm)]">
            <h2 className="text-sm font-semibold tracking-tight text-[var(--pg-text)]">Appearance</h2>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-[var(--pg-text-muted)]">
              Choose Executive Workspace (bright) or Mission Control (dark), or follow your system preference. The interface adapts instantly across Peergent.
            </p>
            <div className="mt-6">
              <PgThemeToggle />
            </div>
          </div>

          <div className="mt-4 rounded-[var(--pg-radius-xl)] border border-[var(--pg-border-soft)] bg-[var(--pg-surface)] p-8">
            <p className="text-sm leading-relaxed text-[var(--pg-text-muted)]">
              Organization and team member settings will appear here in a future sprint.
            </p>
          </div>
        </section>
      </PgAppShell>
    </main>
  );
}
