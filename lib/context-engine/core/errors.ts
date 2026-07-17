export class ContextEngineError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ContextEngineError";
  }
}

export class MissingScopeError extends ContextEngineError {
  constructor(message: string) {
    super(message);
    this.name = "MissingScopeError";
  }
}

export class UnknownLayerError extends ContextEngineError {
  constructor(layerKey: string) {
    super(`Unknown context layer: ${layerKey}`);
    this.name = "UnknownLayerError";
  }
}

export class ScopeAccessError extends ContextEngineError {
  constructor(message: string) {
    super(message);
    this.name = "ScopeAccessError";
  }
}

export class OrganizationNotFoundError extends ContextEngineError {
  constructor(organizationId: string) {
    super(`Organization not found: ${organizationId}`);
    this.name = "OrganizationNotFoundError";
  }
}

export class PeerNotFoundError extends ContextEngineError {
  constructor(peerId: string, organizationId: string) {
    super(`Peer not found in organization: ${peerId} (${organizationId})`);
    this.name = "PeerNotFoundError";
  }
}
