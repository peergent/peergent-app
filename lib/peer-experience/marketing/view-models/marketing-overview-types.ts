import type { MarketingMorningBriefViewModel } from "../domain/marketing-peer-types";
import type { MarketingResultMetric } from "../domain/marketing-peer-types";
import type { MarketingBrainInsight } from "../domain/marketing-peer-types";
import type { MarketingApprovalQueueItem } from "../domain/marketing-peer-types";
import type { UpcomingWorkGroup } from "./build-marketing-upcoming-work";
import type { MarketingActivity } from "../domain/marketing-peer-types";

import type { ResponsibilityPlanningItem } from "../responsibilities/types";

export type MarketingOverviewResponsibilityCard = {
  id: string;
  title: string;
  goal: string;
  healthLabel: string;
  href: string;
};

export type MarketingOverviewViewModel = {
  morningBrief: MarketingMorningBriefViewModel;
  responsibilities: {
    ownedCount: number;
    items: MarketingOverviewResponsibilityCard[];
    viewAllHref: string;
    viewAllLabel: string;
    emptyMessage: string;
  };
  planning: {
    items: ResponsibilityPlanningItem[];
    emptyMessage: string;
  };
  results: {
    metrics: MarketingResultMetric[];
    periodLabel: string;
    performanceHref: string;
    performanceCtaLabel: string;
  };
  brain: {
    insights: MarketingBrainInsight[];
    emptyMessage: string;
    viewAllHref: string;
    viewAllLabel: string;
  };
  attention: {
    items: MarketingApprovalQueueItem[];
    emptyMessage: string;
    emptySupportingMessage: string;
    viewAllHref: string;
    viewAllLabel: string;
  };
  upcoming: {
    groups: UpcomingWorkGroup[];
    emptyMessage: string;
    viewAllHref: string;
    viewAllLabel: string;
  };
  activity: {
    items: MarketingActivity[];
    emptyMessage: string;
  };
};
