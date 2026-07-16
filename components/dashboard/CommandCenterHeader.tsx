import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
import type { GreetingData } from "@/lib/command-center/types";

type CommandCenterHeaderProps = {
  greeting: GreetingData;
};

export default function CommandCenterHeader({
  greeting,
}: CommandCenterHeaderProps) {
  return (
    <PageHeader
      size="compact"
      eyebrow={greeting.formattedDate}
      title={`${greeting.salutation}, ${greeting.name}`}
      description={greeting.subtitle}
      actions={
        <Button
          variant="ghost"
          size="sm"
          disabled
          title="Workspace switching coming soon"
          aria-label={`Workspace: ${greeting.workspaceName}. Switching coming soon.`}
          className="text-slate-500"
        >
          {greeting.workspaceName}
        </Button>
      }
    />
  );
}
