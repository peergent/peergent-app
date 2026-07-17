import type { ReactNode } from "react";
import { cn } from "@/lib/ui/cn";

type WorkspacePanelProps = {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
  headingLevel?: "h2" | "h3";
  compact?: boolean;
};

export default function WorkspacePanel({
  title,
  description,
  children,
  className,
  headingLevel: Heading = "h2",
  compact = false,
}: WorkspacePanelProps) {
  return (
    <section
      className={cn(
        "rounded-[24px] border border-white/[0.05] bg-white/[0.015] shadow-[0_4px_24px_rgba(0,0,0,0.12)]",
        compact ? "p-5 md:p-6" : "p-6 md:p-7",
        className
      )}
    >
      <header className={cn(compact ? "mb-4" : "mb-6")}>
        <Heading className="text-[15px] font-semibold tracking-tight text-white/95">
          {title}
        </Heading>
        {description && (
          <p className="mt-1.5 text-sm leading-relaxed text-slate-500">
            {description}
          </p>
        )}
      </header>
      {children}
    </section>
  );
}
