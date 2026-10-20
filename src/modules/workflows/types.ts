export type WorkflowNode = {
  id: string;
  type: "delay" | "manual_task" | "condition" | "note";
  label: string;
  config?: Record<string, unknown>;
};

export type WorkflowDefinition = {
  nodes: WorkflowNode[];
  edges: Array<{ id: string; source: string; target: string }>;
};
