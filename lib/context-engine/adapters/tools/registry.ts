export type ToolDefinition = {
  name: string;
  description: string;
  schema: Record<string, unknown>;
  requiredPolicy: "assist" | "collaborate" | "autopilot";
};

export class ToolRegistry {
  private readonly tools = new Map<string, ToolDefinition>();

  register(tool: ToolDefinition) {
    this.tools.set(tool.name, tool);
  }

  get(name: string) {
    return this.tools.get(name);
  }

  list() {
    return [...this.tools.values()];
  }
}

export const defaultToolRegistry = new ToolRegistry();
