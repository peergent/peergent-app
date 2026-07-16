"use client";

import { forwardRef, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/ui/cn";

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
  hint?: string;
  error?: string;
};

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea({ label, hint, error, className, id, ...props }, ref) {
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
        <textarea
          ref={ref}
          id={inputId}
          className={cn(
            "min-h-[120px] w-full resize-y rounded-[var(--pg-radius-md)] border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm leading-6 text-white placeholder:text-slate-500 transition-[border-color,box-shadow,background-color] duration-[var(--pg-duration-base)] focus:border-violet-500/40 focus:bg-white/[0.05] focus:outline-none focus:ring-2 focus:ring-violet-500/20 disabled:cursor-not-allowed disabled:opacity-50",
            error &&
              "border-red-500/40 focus:border-red-500/40 focus:ring-red-500/20",
            className
          )}
          {...props}
        />
        {error ? (
          <p className="mt-2 text-xs text-red-400">{error}</p>
        ) : hint ? (
          <p className="mt-2 text-xs text-slate-500">{hint}</p>
        ) : null}
      </div>
    );
  }
);

export default Textarea;
