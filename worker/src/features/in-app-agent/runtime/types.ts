import type {
  AgUiContext,
  AgUiMessage,
  InAppAgentToolApprovalRequest,
} from "@langfuse/shared/in-app-agent";

type AgUiTool = {
  name: string;
  description: string;
  parameters?: unknown;
  metadata?: Record<string, unknown>;
};

export type ResumeForwardedProps = {
  command: {
    resume: {
      approved: boolean;
      approvalRequest: InAppAgentToolApprovalRequest;
    };
  };
};

export type AgUiRunAgentInput = {
  threadId: string;
  runId: string;
  parentRunId?: string;
  state?: unknown;
  messages: AgUiMessage[];
  tools: AgUiTool[];
  context: AgUiContext;
  forwardedProps?: unknown;
};
