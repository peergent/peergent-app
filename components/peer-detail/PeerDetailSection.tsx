import type { ReactNode } from "react";

type PeerDetailSectionProps = {
  title: string;
  description?: string;
  demo?: boolean;
  children: ReactNode;
  className?: string;
};

export default function PeerDetailSection({
  title,
  description,
  demo = false,
  children,
  className = "",
}: PeerDetailSectionProps) {
  return (
    <section
      className={`rounded-2xl border border-white/10 bg-[#0b1120]/90 p-5 shadow-xl shadow-black/10 backdrop-blur md:p-6 ${className}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">{title}</h2>
          {description && (
            <p className="mt-1 text-sm text-slate-400">{description}</p>
          )}
        </div>

        {demo && (
          <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs text-slate-500">
            Demo data
          </span>
        )}
      </div>

      <div className="mt-5">{children}</div>
    </section>
  );
}
