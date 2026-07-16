import { History } from "lucide-react";
import ReportChapter from "@/components/dashboard/ReportChapter";
import Timeline from "@/components/ui/Timeline";
import DataLabelBadge from "@/components/dashboard/DataLabelBadge";
import type { ActivityEntry } from "@/lib/command-center/types";

type RecentBusinessActivityProps = {
  activities: ActivityEntry[];
};

export default function RecentBusinessActivity({
  activities,
}: RecentBusinessActivityProps) {
  return (
    <ReportChapter
      step={7}
      icon={History}
      title="What changed since yesterday"
      action={<DataLabelBadge label="demo-data" />}
    >
      <Timeline
        variant="quiet"
        timestampPosition="left"
        items={activities.map((activity) => ({
          id: activity.id,
          title: activity.title,
          description: activity.description,
          timestamp: activity.time,
        }))}
      />
    </ReportChapter>
  );
}
