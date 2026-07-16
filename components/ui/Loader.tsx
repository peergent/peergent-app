import { cn } from "@/lib/ui/cn";

export type LoaderProps = {
  size?: "sm" | "md" | "lg";
  className?: string;
  label?: string;
};

const sizeStyles = {
  sm: "h-4 w-4 border-2",
  md: "h-6 w-6 border-2",
  lg: "h-8 w-8 border-[3px]",
};

export default function Loader({
  size = "md",
  className,
  label = "Loading",
}: LoaderProps) {
  return (
    <span
      role="status"
      aria-label={label}
      className={cn(
        "inline-block animate-spin rounded-full border-white/20 border-t-white",
        sizeStyles[size],
        className
      )}
    />
  );
}
