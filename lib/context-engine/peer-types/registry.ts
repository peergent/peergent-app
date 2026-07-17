import type { PeerRole } from "../types/peer";
import type { PeerTypeModule } from "./base";
import { customModule, financeModule } from "./finance/module";
import { marketingModule } from "./marketing/module";
import { plannerModule } from "./planner/module";
import { salesModule } from "./sales/module";
import { supportModule } from "./support/module";

const PEER_TYPE_MODULES: Record<PeerRole, PeerTypeModule> = {
  Sales: salesModule,
  Marketing: marketingModule,
  Support: supportModule,
  Planning: plannerModule,
  Finance: financeModule,
  Custom: customModule,
};

export class PeerTypeRegistry {
  private readonly modules: Map<PeerRole, PeerTypeModule>;

  constructor(modules: Record<PeerRole, PeerTypeModule> = PEER_TYPE_MODULES) {
    this.modules = new Map(Object.entries(modules) as [PeerRole, PeerTypeModule][]);
  }

  get(role: PeerRole): PeerTypeModule {
    return this.modules.get(role) ?? customModule;
  }

  list(): PeerTypeModule[] {
    return [...this.modules.values()];
  }

  allLoaders(): PeerTypeModule["loaders"] {
    return this.list().flatMap((module) => module.loaders);
  }
}

export const defaultPeerTypeRegistry = new PeerTypeRegistry();
