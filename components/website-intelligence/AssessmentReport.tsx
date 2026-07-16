import AssessmentCanvas from "@/components/website-intelligence/AssessmentCanvas";
import type {
  WebsiteIntelligenceAssessment,
  WorkforceRecommendation,
} from "@/lib/website-intelligence";

type AssessmentReportProps = {
  assessment: WebsiteIntelligenceAssessment;
  onAnalyzeAnother: () => void;
  onOpenCreatePeer: (employee: WorkforceRecommendation) => void;
};

export default function AssessmentReport(props: AssessmentReportProps) {
  return <AssessmentCanvas {...props} />;
}
