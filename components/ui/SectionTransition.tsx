"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/ui/cn";

export type SectionTransitionProps = {
  children: ReactNode;
  /** Reveal when scrolled into view. Default false — mount animation only. */
  revealOnScroll?: boolean;
  /** Root margin for intersection observer. */
  rootMargin?: string;
  /** Delay before animation starts (ms). */
  delay?: number;
  className?: string;
};

export default function SectionTransition({
  children,
  revealOnScroll = false,
  rootMargin = "0px 0px -8% 0px",
  delay = 0,
  className,
}: SectionTransitionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(!revealOnScroll);

  useEffect(() => {
    if (!revealOnScroll) {
      setVisible(true);
      return;
    }

    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin, threshold: 0.12 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [revealOnScroll, rootMargin]);

  return (
    <div
      ref={ref}
      className={cn(
        visible ? "pg-section-enter" : "opacity-0",
        className
      )}
      style={{ animationDelay: delay ? `${delay}ms` : undefined }}
    >
      {children}
    </div>
  );
}
