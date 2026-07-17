import { createPeerTypeModule } from "../base";

export const financeModule = createPeerTypeModule("Finance", [
  "Pricing",
  "Invoicing",
  "Compliance",
]);

export const customModule = createPeerTypeModule("Custom", ["General assistance"]);
