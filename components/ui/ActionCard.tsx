import type { ReactNode } from "react";
import Card from "@/components/ui/Card";
import { cn } from "@/lib/ui/cn";

export type ActionCardProps = {
  title: string;
  description: string;
  icon?: ReactNode;
  action?: ReactNode;
  onClick?: () => void;
  className?: string;
};

export default function ActionCard({
  title,
  description,
  icon,
  action,
  onClick,
  className,
}: ActionCardProps) {
  const interactive = Boolean(onClick);

  return (
    <Card
      variant={interactive ? "interactive" : "default"}
      className={cn("group", className)}
      padding="md"
      onClick={onClick}
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      onKeyDown={
        interactive
          ? (event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onClick?.();
              }
            }
          : undefined
      }
    >
      <div className="flex items-start gap-4">
        {icon && (
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--pg-radius-lg)] border border-white/10 bg-white/[0.03] text-slate-300 transition-colors duration-[var(--pg-duration-base)] group-hover:border-violet-500/20 group-hover:text-violet-300">
            {icon}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold text-white">{title}</h3>
          <p className="mt-1 text-sm leading-6 text-slate-400">{description}</p>
          {action && <div className="mt-4">{action}</div>}
        </div>
      </div>
    </Card>
  );
}
