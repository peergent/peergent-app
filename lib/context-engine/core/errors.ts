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
