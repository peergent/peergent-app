import { ArrowRight, Compass } from "lucide-react";
import Badge from "@/components/ui/Badge";
import ButtonLink from "@/components/ui/ButtonLink";
import ReportChapter from "@/components/dashboard/ReportChapter";
import type { RecommendedAction } from "@/lib/command-center/types";

type RecommendedActionsProps = {
  actions: RecommendedAction[];
};

export default function RecommendedActions({ actions }: RecommendedActionsProps) {
  const [primary, ...rest] = actions;

  return (
    <ReportChapter step={3} icon={Compass} title="Next Move">
      {primary && (
        <div className="flex items-start gap-4">
          <span className="text-xs font-medium tabular-nums text-violet-400/70">
            01
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-base font-semibold text-white">{primary.label}</p>
            <p className="mt-2 text-sm text-slate-500">{primary.description}</p>
            <div className="mt-5">
              {primary.href && !primary.disabled ? (
                <ButtonLink
                  href={primary.href}
                  variant="primary"
                  size="md"
                  rightIcon={<ArrowRight size={16} />}
                >
                  {primary.label}
                </ButtonLink>
              ) : (
                <Badge variant="neutral" size="sm">
                  {primary.disabledReason ?? "Coming soon"}
                </Badge>
              )}
            </div>
          </div>
        </div>
      )}

      {rest.length > 0 && (
        <ul className="mt-6 divide-y divide-white/[0.06] border-t border-white/[0.06]">
          {rest.map((action, index) => (
            <li
              key={action.id}
              className="flex items-start justify-between gap-4 py-3 first:pt-5"
            >
              <div className="flex gap-3">
                <span className="text-xs tabular-nums text-slate-700">
                  {String(index + 2).padStart(2, "0")}
                </span>
                <div>
                  <p className="text-sm font-medium text-slate-400">
                    {action.label}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-600">
                    {action.description}
                  </p>
                </div>
              </div>

              {action.href && !action.disabled ? (
                <ButtonLink href={action.href} variant="ghost" size="sm">
                  Open
                </ButtonLink>
              ) : (
                <Badge variant="neutral" size="sm" className="shrink-0">
                  {action.disabledReason ?? "Soon"}
                </Badge>
              )}
            </li>
          ))}
        </ul>
      )}
    </ReportChapter>
  );
}
