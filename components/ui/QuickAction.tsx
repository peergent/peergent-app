import type { ReactNode } from "react";
import { cn } from "@/lib/ui/cn";

export type QuickActionProps = {
  label: string;
  description?: string;
  icon?: ReactNode;
  onClick?: () => void;
  href?: string;
  className?: string;
};

export default function QuickAction({
  label,
  description,
  icon,
  onClick,
  href,
  className,
}: QuickActionProps) {
  const content = (
    <>
      {icon && (
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--pg-radius-md)] border border-white/10 bg-white/[0.03] text-slate-300 transition-colors duration-[var(--pg-duration-base)] group-hover:border-violet-500/20 group-hover:text-violet-300">
          {icon}
        </span>
      )}
      <span className="min-w-0">
        <span className="block text-sm font-medium text-white">{label}</span>
        {description && (
          <span className="mt-0.5 block text-xs text-slate-500">
            {description}
          </span>
        )}
      </span>
    </>
  );

  const sharedClassName = cn(
    "group flex w-full items-center gap-3 rounded-[var(--pg-radius-lg)] border border-white/10 bg-white/[0.02] px-4 py-3 text-left transition-[border-color,background-color,transform] duration-[var(--pg-duration-base)] hover:border-violet-500/20 hover:bg-white/[0.04] active:scale-[0.99] focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/30",
    className
  );

  if (href) {
    return (
      <a href={href} className={sharedClassName}>
        {content}
      </a>
    );
  }

  return (
    <button type="button" onClick={onClick} className={sharedClassName}>
      {content}
    </button>
  );
}
