"use client";

import {
  Children,
  cloneElement,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from "react";
import { stagger } from "@/lib/ui/motion";
import { cn } from "@/lib/ui/cn";

export type FadeSequenceProps = {
  children: ReactNode;
  /** Delay before the first child animates (ms). */
  initialDelay?: number;
  /** Delay between each child (ms). Defaults to motion stagger step. */
  staggerStep?: number;
  /** Max children to stagger — rest appear with last delay. */
  maxItems?: number;
  className?: string;
};

export default function FadeSequence({
  children,
  initialDelay = 0,
  staggerStep = stagger.step,
  maxItems = stagger.maxItems,
  className,
}: FadeSequenceProps) {
  const items = Children.toArray(children);

  return (
    <div className={cn(className)}>
      {items.map((child, index) => {
        const cappedIndex = Math.min(index, maxItems - 1);
        const delay = initialDelay + cappedIndex * staggerStep;

        if (!isValidElement(child)) {
          return (
            <div
              key={index}
              className="pg-surface-reveal-up"
              style={{ animationDelay: `${delay}ms` }}
            >
              {child}
            </div>
          );
        }

        const element = child as ReactElement<{ className?: string; style?: React.CSSProperties }>;

        return cloneElement(element, {
          key: element.key ?? index,
          className: cn("pg-surface-reveal-up", element.props.className),
          style: {
            ...element.props.style,
            animationDelay: `${delay}ms`,
          },
        });
      })}
    </div>
  );
}
