import type { ReactNode } from "react";
import { cn } from "@/lib/ui/cn";

export type SectionWeight = "hero" | "primary" | "secondary" | "quiet";

export type SectionProps = {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  weight?: SectionWeight;
  className?: string;
};

const weightStyles: Record<
  SectionWeight,
  { shell: string; title: string; description: string; bodyGap: string }
> = {
  hero: {
    shell: "border-white/10 bg-[#0b1120]/90 p-6 md:p-8",
    title: "text-lg font-semibold tracking-tight text-white",
    description: "mt-1.5 text-sm leading-6 text-slate-400",
    bodyGap: "mt-8",
  },
  primary: {
    shell: "border-white/10 bg-[#0b1120]/90 p-5 md:p-6",
    title: "text-base font-semibold tracking-tight text-white",
    description: "mt-1 text-sm leading-6 text-slate-400",
    bodyGap: "mt-6",
  },
  secondary: {
    shell: "border-white/[0.08] bg-[#0a0f1c]/90 p-5 md:p-6",
    title: "text-base font-semibold tracking-tight text-white/95",
    description: "mt-1 text-sm leading-6 text-slate-500",
    bodyGap: "mt-5",
  },
  quiet: {
    shell: "border-white/[0.06] bg-transparent p-4 md:p-5 shadow-none",
    title: "text-sm font-medium tracking-tight text-slate-300",
    description: "mt-1 text-sm leading-6 text-slate-500",
    bodyGap: "mt-4",
  },
};

export default function Section({
  title,
  description,
  action,
  children,
  weight = "primary",
  className,
}: SectionProps) {
  const styles = weightStyles[weight];

  return (
    <section
      className={cn(
        "rounded-[var(--pg-radius-xl)] border backdrop-blur",
        styles.shell,
        className
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className={styles.title}>{title}</h2>
          {description && <p className={styles.description}>{description}</p>}
        </div>
        {action}
      </div>
      <div className={styles.bodyGap}>{children}</div>
    </section>
  );
}
