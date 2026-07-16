import type { ReactNode } from "react";
import { cn } from "@/lib/ui/cn";

export type PlaneTone = "primary" | "secondary" | "quiet";

export type PlaneProps = {
  title: string;
  description?: string;
  action?: ReactNode;
  tone?: PlaneTone;
  children: ReactNode;
  className?: string;
};

const toneStyles: Record<
  PlaneTone,
  { title: string; description: string; bodyGap: string }
> = {
  primary: {
    title: "text-base font-semibold tracking-tight text-white",
    description: "mt-1 text-sm leading-6 text-slate-500",
    bodyGap: "mt-8",
  },
  secondary: {
    title: "text-sm font-semibold tracking-tight text-white/90",
    description: "mt-1 text-sm leading-6 text-slate-600",
    bodyGap: "mt-6",
  },
  quiet: {
    title: "text-sm font-medium tracking-tight text-slate-400",
    description: "mt-1 text-sm leading-6 text-slate-600",
    bodyGap: "mt-5",
  },
};

export default function Plane({
  title,
  description,
  action,
  tone = "primary",
  children,
  className,
}: PlaneProps) {
  const styles = toneStyles[tone];

  return (
    <section className={cn(className)}>
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
