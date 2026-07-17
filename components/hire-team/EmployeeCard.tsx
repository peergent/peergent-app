import { cn } from "@/lib/ui/cn";
import type { HireEmployeeCard } from "@/lib/hire-team/hire-team-presenter";

type EmployeeCardProps = {
  employee: HireEmployeeCard;
  className?: string;
  highlighted?: boolean;
  delayClass?: string;
};

export default function EmployeeCard({
  employee,
  className,
  highlighted,
  delayClass,
}: EmployeeCardProps) {
  return (
    <article
      className={cn(
        "group relative overflow-hidden rounded-[22px] border bg-white/[0.02] p-6 transition-all duration-300 ease-out",
        "shadow-[0_8px_32px_rgba(0,0,0,0.2)]",
        delayClass,
        highlighted
          ? "border-violet-500/20 shadow-[0_12px_40px_rgba(124,58,237,0.1)]"
          : "border-white/[0.06] hover:-translate-y-0.5 hover:border-violet-500/15 hover:shadow-[0_12px_40px_rgba(0,0,0,0.28)]",
        className
      )}
    >
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-violet-500/[0.04] via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        aria-hidden
      />

      <div className="relative flex items-start gap-4">
        <div
          className={cn(
            "flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ring-1 ring-white/10",
            employee.gradient
          )}
        >
          <span className="h-2.5 w-2.5 rounded-full bg-white/90 shadow-[0_0_8px_rgba(255,255,255,0.4)]" />
        </div>
        <div className="min-w-0 flex-1 pt-0.5">
          <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-slate-600">
            {employee.focus}
          </p>
          <p className="mt-1 text-base font-medium tracking-tight text-white">
            {employee.name}
          </p>
        </div>
        <span
          className="mt-1 flex h-2 w-2 shrink-0 rounded-full bg-emerald-400/60 shadow-[0_0_8px_rgba(52,211,153,0.35)]"
          title="Joining"
          aria-label="Joining"
        />
      </div>

      <ul className="relative mt-5 space-y-2.5 border-t border-white/[0.05] pt-5">
        {employee.bullets.map((bullet) => (
          <li key={bullet} className="text-[13px] leading-relaxed text-slate-500">
            {bullet}
          </li>
        ))}
      </ul>
    </article>
  );
}
