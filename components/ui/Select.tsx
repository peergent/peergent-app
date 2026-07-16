"use client";

import { forwardRef, type SelectHTMLAttributes } from "react";
import { cn } from "@/lib/ui/cn";

export type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  hint?: string;
  error?: string;
};

const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, hint, error, className, id, children, ...props },
  ref
) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="mb-2 block text-sm font-medium text-slate-300"
        >
          {label}
        </label>
      )}
      <select
        ref={ref}
        id={inputId}
        className={cn(
          "h-11 w-full appearance-none rounded-[var(--pg-radius-md)] border border-white/10 bg-white/[0.03] px-3 text-sm text-white transition-[border-color,box-shadow,background-color] duration-[var(--pg-duration-base)] focus:border-violet-500/40 focus:bg-white/[0.05] focus:outline-none focus:ring-2 focus:ring-violet-500/20 disabled:cursor-not-allowed disabled:opacity-50",
          error &&
            "border-red-500/40 focus:border-red-500/40 focus:ring-red-500/20",
          className
        )}
        {...props}
      >
        {children}
      </select>
      {error ? (
        <p className="mt-2 text-xs text-red-400">{error}</p>
      ) : hint ? (
        <p className="mt-2 text-xs text-slate-500">{hint}</p>
      ) : null}
    </div>
  );
});

export default Select;
