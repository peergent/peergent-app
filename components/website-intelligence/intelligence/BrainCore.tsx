import PresenceIndicator from "@/components/ui/PresenceIndicator";
import { cn } from "@/lib/ui/cn";

type BrainCoreProps = {
  size?: "sm" | "lg";
  className?: string;
};

export default function BrainCore({ size = "lg", className }: BrainCoreProps) {
  const large = size === "lg";

  return (
    <div
      className={cn(
        "relative flex shrink-0 items-center justify-center",
        large ? "h-16 w-16" : "h-10 w-10",
        className
      )}
      aria-hidden
    >
      <span
        className={cn(
          "absolute inset-0 rounded-full bg-violet-500/15 blur-xl pg-breathe",
          large && "scale-110"
        )}
      />
      <span
        className={cn(
          "absolute inset-[18%] rounded-full bg-violet-500/10 blur-md pg-breathe"
        )}
        style={{ animationDelay: "1.2s" }}
      />
      <span
        className={cn(
          "relative flex items-center justify-center rounded-full border border-violet-400/20 bg-gradient-to-br from-violet-500/15 to-indigo-500/5 shadow-[0_0_32px_rgba(139,92,246,0.12)]",
          large ? "h-12 w-12" : "h-8 w-8"
        )}
      >
        <PresenceIndicator mode="watching" size={large ? "md" : "sm"} />
      </span>
    </div>
  );
}
