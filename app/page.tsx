import Link from "next/link";
import MarketingNav from "@/components/marketing/MarketingNav";
import ButtonLink from "@/components/ui/ButtonLink";
import { ArrowRight } from "lucide-react";

export default function MarketingHomePage() {
  return (
    <div className="min-h-screen bg-[#030712] text-white">
      <MarketingNav />

      <main>
        <section className="relative overflow-hidden px-5 pb-24 pt-16 md:px-8 md:pt-24">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute left-1/2 top-0 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-violet-600/[0.08] blur-[140px]" />
          </div>

          <div className="relative mx-auto max-w-4xl text-center">
            <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-violet-400/80">
              AI Workforce Platform
            </p>
            <h1 className="mt-5 text-balance text-[2.5rem] font-semibold leading-[1.08] tracking-tight text-white md:text-[3.5rem]">
              Hire AI colleagues who work like members of your team.
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-balance text-lg leading-relaxed text-slate-400">
              Peergent gives every business its own workspace, organization, and
              AI peers — built for trust, autonomy, and real work.
            </p>

            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <ButtonLink href="/signup" size="lg" rightIcon={<ArrowRight size={18} />}>
                Start Free
              </ButtonLink>
              <Link
                href="/login"
                className="pg-focus-premium inline-flex min-h-11 items-center rounded-[18px] border border-white/[0.08] bg-white/[0.03] px-7 py-3.5 text-sm font-medium text-white/90 transition hover:border-white/[0.14] hover:bg-white/[0.06]"
              >
                Login
              </Link>
            </div>
          </div>
        </section>

        <section className="border-t border-white/[0.06] px-5 py-20 md:px-8">
          <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-3">
            {[
              {
                title: "Your organization",
                copy: "Every account gets an isolated workspace with its own data and AI team.",
              },
              {
                title: "Trusted colleagues",
                copy: "Watch current work, decisions, and learning — not dashboards and settings.",
              },
              {
                title: "Ready to scale",
                copy: "Architecture supports multiple users per organization when you are.",
              },
            ].map((item) => (
              <article
                key={item.title}
                className="rounded-[24px] border border-white/[0.06] bg-white/[0.02] p-6"
              >
                <h2 className="text-lg font-semibold text-white">{item.title}</h2>
                <p className="mt-3 text-sm leading-relaxed text-slate-500">
                  {item.copy}
                </p>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
