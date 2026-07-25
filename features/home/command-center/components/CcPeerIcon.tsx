import type { HqServiceKey } from "@/lib/hq/hq-service-key";
import {
  FinancePeerIcon,
  MarketingPeerIcon,
  OperationsPeerIcon,
  SalesPeerIcon,
  SupportPeerIcon,
} from "@/features/hq/components/hq-icons";

export function CcPeerIcon({
  serviceKey,
  large,
}: {
  serviceKey: HqServiceKey;
  large?: boolean;
}) {
  const className = `command-center__peer-icon command-center__peer-icon--${serviceKey}${
    large ? " command-center__peer-icon--lg" : ""
  }`;

  return (
    <div className={className} aria-hidden>
      {serviceKey === "sales" && <SalesPeerIcon />}
      {serviceKey === "marketing" && <MarketingPeerIcon />}
      {serviceKey === "finance" && <FinancePeerIcon />}
      {serviceKey === "support" && <SupportPeerIcon />}
      {serviceKey === "operations" && <OperationsPeerIcon />}
    </div>
  );
}
