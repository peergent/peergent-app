"use client";

import Sidebar from "@/components/Sidebar";
import PageHeader from "@/components/ui/PageHeader";

export default function IntegrationsPage() {
  return (
    <main className="min-h-screen bg-[#030712] text-white">
      <div className="relative mx-auto flex min-h-screen max-w-[1600px]">
        <Sidebar />

        <section className="min-w-0 flex-1 p-5 md:p-8 lg:p-10">
          <PageHeader
            eyebrow="Workspace"
            title="Integrations"
            description="Connect the tools your AI team works with. Coming soon."
          />

          <div className="mt-8 rounded-[24px] border border-white/[0.06] bg-white/[0.02] p-8">
            <p className="text-sm leading-relaxed text-slate-500">
              Integrations will live here — CRM, email, calendar, and more — scoped
              to your organization.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
