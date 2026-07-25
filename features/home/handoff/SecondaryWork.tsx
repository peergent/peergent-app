import type { HandoffSecondaryItem } from "@/lib/home/handoff-types";
import { cn } from "@/lib/ui/cn";

type SecondaryWorkProps = {
  items: HandoffSecondaryItem[];
  visible: boolean;
  className?: string;
};

export default function SecondaryWork({ items, visible, className }: SecondaryWorkProps) {
  if (items.length === 0) return null;

  return (
    <ul
      className={cn(
        "mt-8 space-y-2 transition-opacity duration-500",
        visible ? "opacity-100" : "opacity-0",
        className
      )}
      aria-label="Other items waiting"
    >
      {items.map((item) => (
        <li
          key={item.id}
          className="text-[15px] text-[var(--pg-color-text-tertiary)] opacity-60"
        >
          {item.label}
        </li>
      ))}
    </ul>
  );
}
