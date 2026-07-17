"use client";

import Sidebar from "@/components/Sidebar";
import PageHeader from "@/components/ui/PageHeader";

export default function SettingsPage() {
  return (
    <main className="min-h-screen bg-[#030712] text-white">
      <div className="relative mx-auto flex min-h-screen max-w-[1600px]">
        <Sidebar />

        <section className="min-w-0 flex-1 p-5 md:p-8 lg:p-10">
          <PageHeader
            eyebrow="Workspace"
            title="Settings"
            description="Organization and account preferences. Coming soon."
          />

          <div className="mt-8 rounded-[24px] border border-white/[0.06] bg-white/[0.02] p-8">
            <p className="text-sm leading-relaxed text-slate-500">
              Settings for your organization and team members will appear here in a
              future sprint.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
