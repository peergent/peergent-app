"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import WebsiteIntelligenceExperience from "@/components/website-intelligence/WebsiteIntelligenceExperience";
import { ArrowLeft } from "lucide-react";

function WebsiteIntelligenceRedirectInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const peerId = searchParams.get("peerId");
  const forceLegacy = searchParams.get("legacy") === "1";

  useEffect(() => {
    if (peerId && !forceLegacy) {
      router.replace(
        `/team/${encodeURIComponent(peerId)}/settings/website-intelligence`
      );
    }
  }, [forceLegacy, peerId, router]);

  if (peerId && !forceLegacy) return null;

  return (
    <main className="min-h-screen bg-[#030712] text-white">
      <div className="relative mx-auto flex min-h-screen max-w-[1600px]">
        <Sidebar />
        <section className="relative min-w-0 flex-1 overflow-x-hidden p-5 md:p-8 lg:p-10">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-white"
          >
            <ArrowLeft size={16} />
            Back
          </Link>
          <WebsiteIntelligenceExperience variant="legacy" enableHireJourney />
        </section>
      </div>
    </main>
  );
}

export default function WebsiteIntelligencePage() {
  return (
    <Suspense fallback={null}>
      <WebsiteIntelligenceRedirectInner />
    </Suspense>
  );
}
