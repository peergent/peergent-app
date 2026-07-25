import { cn } from "@/lib/ui/cn";

type HomeStatusProps = {
  visible?: boolean;
  className?: string;
};

export default function HomeStatus({ visible = true, className }: HomeStatusProps) {
  return (
    <p
      className={cn(
        "mt-8 flex items-center justify-center gap-2 text-sm text-[var(--pg-color-text-tertiary)]",
        "transition-opacity duration-500",
        visible ? "opacity-100" : "opacity-0",
        className
      )}
    >
      <span className="home-status-dot" aria-hidden />
      Your AI team is working in the background
    </p>
  );
}
