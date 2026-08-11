import type { ProjectScope } from "../../features/rbac/projectAccessRights";
import { hasProjectAccessByRole } from "../../features/rbac/projectAccessRights";
import { Role } from "../../db";
import { IN_APP_AGENT_REDIRECT_TOOL_NAME } from "../constants";

type InAppAgentMcpToolApproval = "auto" | "approval";

export type InAppAgentUserAccess = {
  projectRole?: Role;
  // Global Langfuse admin flag. This bypasses project membership checks.
  isAdmin: boolean;
};

type InAppAgentMcpToolPolicy = {
  approval: InAppAgentMcpToolApproval;
  availability: {
    scope: ProjectScope;
  };
};

// Exhaustive approval policy for Langfuse MCP tools. Keys use the unprefixed
// MCP registry names and are the source of truth for the tool-name type below.
// Exhaustiveness against web's MCP toolRegistry is enforced by type and runtime
// assertions in web's in-app-agent stream servertest, so new MCP tools must be
// classified before the in-app agent can auto/approval-gate them.
export const IN_APP_AGENT_LANGFUSE_MCP_TOOL_POLICIES = {
  listAnnotationQueues: {
    approval: "auto",
    availability: { scope: "annotationQueues:read" },
  },
  createAnnotationQueue: {
    approval: "approval",
    availability: { scope: "annotationQueues:CUD" },
  },
  getAnnotationQueue: {
    approval: "auto",
    availability: { scope: "annotationQueues:read" },
  },
  listAnnotationQueueItems: {
    approval: "auto",
    availability: { scope: "annotationQueues:read" },
  },
  getAnnotationQueueItem: {
    approval: "auto",
    availability: { scope: "annotationQueues:read" },
  },
  createAnnotationQueueItem: {
    approval: "approval",
    availability: { scope: "annotationQueues:CUD" },
  },
  updateAnnotationQueueItem: {
    approval: "approval",
    availability: { scope: "annotationQueues:CUD" },
  },
  deleteAnnotationQueueItem: {
    approval: "approval",
    availability: { scope: "annotationQueues:CUD" },
  },
  createAnnotationQueueAssignment: {
    approval: "approval",
    availability: { scope: "annotationQueueAssignments:CUD" },
  },
  deleteAnnotationQueueAssignment: {
    approval: "approval",
    availability: { scope: "annotationQueueAssignments:CUD" },
  },
  createComment: {
    approval: "approval",
    availability: { scope: "comments:CUD" },
  },
  listComments: {
    approval: "auto",
    availability: { scope: "comments:read" },
  },
  getComment: {
    approval: "auto",
    availability: { scope: "comments:read" },
  },
  upsertDataset: {
    approval: "approval",
    availability: { scope: "datasets:CUD" },
  },
  listDatasets: {
    approval: "auto",
    availability: { scope: "datasets:read" },
  },
  getDataset: {
    approval: "auto",
    availability: { scope: "datasets:read" },
  },
  upsertDatasetItem: {
    approval: "approval",
    availability: { scope: "datasets:CUD" },
  },
  listDatasetItems: {
    approval: "auto",
    availability: { scope: "datasets:read" },
  },
  getDatasetItem: {
    approval: "auto",
    availability: { scope: "datasets:read" },
  },
  deleteDatasetItem: {
    approval: "approval",
    availability: { scope: "datasets:CUD" },
  },
  createDatasetRunItem: {
    approval: "approval",
    availability: { scope: "datasets:CUD" },
  },
  listDatasetRunItems: {
    approval: "auto",
    availability: { scope: "datasets:read" },
  },
  listDatasetRuns: {
    approval: "auto",
    availability: { scope: "datasets:read" },
  },
  getDatasetRun: {
    approval: "auto",
    availability: { scope: "datasets:read" },
  },
  deleteDatasetRun: {
    approval: "approval",
    availability: { scope: "datasets:CUD" },
  },
  listEvaluators: {
    approval: "auto",
    availability: { scope: "evalTemplate:read" },
  },
  getEvaluator: {
    approval: "auto",
    availability: { scope: "evalTemplate:read" },
  },
  upsertEvaluator: {
    approval: "approval",
    availability: { scope: "evalTemplate:CUD" },
  },
  deleteEvaluator: {
    approval: "approval",
    availability: { scope: "evalTemplate:CUD" },
  },
  listEvaluationRules: {
    approval: "auto",
    availability: { scope: "evalJob:read" },
  },
  getEvaluationRule: {
    approval: "auto",
    availability: { scope: "evalJob:read" },
  },
  createEvaluationRule: {
    approval: "approval",
    availability: { scope: "evalJob:CUD" },
  },
  updateEvaluationRule: {
    approval: "approval",
    availability: { scope: "evalJob:CUD" },
  },
  deleteEvaluationRule: {
    approval: "approval",
    availability: { scope: "evalJob:CUD" },
  },
  listExperiments: {
    approval: "auto",
    availability: { scope: "project:read" },
  },
  listExperimentItems: {
    approval: "auto",
    availability: { scope: "project:read" },
  },
  submitFeedback: {
    approval: "approval",
    availability: { scope: "project:read" },
  },
  getHealth: {
    approval: "auto",
    availability: { scope: "project:read" },
  },
  getMedia: {
    approval: "auto",
    availability: { scope: "project:read" },
  },
  queryMetrics: {
    approval: "auto",
    availability: { scope: "project:read" },
  },
  getMetricsSchema: {
    approval: "auto",
    availability: { scope: "project:read" },
  },
  listModels: {
    approval: "auto",
    availability: { scope: "project:read" },
  },
  createModel: {
    approval: "approval",
    availability: { scope: "models:CUD" },
  },
  getModel: {
    approval: "auto",
    availability: { scope: "project:read" },
  },
  deleteModel: {
    approval: "approval",
    availability: { scope: "models:CUD" },
  },
  listObservations: {
    approval: "auto",
    availability: { scope: "project:read" },
  },
  getObservation: {
    approval: "auto",
    availability: { scope: "project:read" },
  },
  getObservationFieldSchema: {
    approval: "auto",
    availability: { scope: "project:read" },
  },
  getObservationFilterSchema: {
    approval: "auto",
    availability: { scope: "project:read" },
  },
  getObservationFilterValues: {
    approval: "auto",
    availability: { scope: "project:read" },
  },
  getPrompt: {
    approval: "auto",
    availability: { scope: "prompts:read" },
  },
  getPromptUnresolved: {
    approval: "auto",
    availability: { scope: "prompts:read" },
  },
  listAlerts: {
    approval: "auto",
    availability: { scope: "alerts:read" },
  },
  getAlert: {
    approval: "auto",
    availability: { scope: "alerts:read" },
  },
  listPrompts: {
    approval: "auto",
    availability: { scope: "prompts:read" },
  },
  createTextPrompt: {
    approval: "approval",
    availability: { scope: "prompts:CUD" },
  },
  createChatPrompt: {
    approval: "approval",
    availability: { scope: "prompts:CUD" },
  },
  updatePromptLabels: {
    approval: "approval",
    availability: { scope: "prompts:CUD" },
  },
  listScores: {
    approval: "auto",
    availability: { scope: "project:read" },
  },
  getScore: {
    approval: "auto",
    availability: { scope: "project:read" },
  },
  createScore: {
    approval: "approval",
    availability: { scope: "scores:CUD" },
  },
  listScoreConfigs: {
    approval: "auto",
    availability: { scope: "scoreConfigs:read" },
  },
  getScoreConfig: {
    approval: "auto",
    availability: { scope: "scoreConfigs:read" },
  },
  createScoreConfig: {
    approval: "approval",
    availability: { scope: "scoreConfigs:CUD" },
  },
  updateScoreConfig: {
    approval: "approval",
    availability: { scope: "scoreConfigs:CUD" },
  },
  deleteScoreConfig: {
    approval: "approval",
    availability: { scope: "scoreConfigs:CUD" },
  },
  createDashboardWidget: {
    approval: "approval",
    availability: { scope: "dashboards:CUD" },
  },
  listDashboardWidgets: {
    approval: "auto",
    availability: { scope: "dashboards:read" },
  },
  getDashboardWidget: {
    approval: "auto",
    availability: { scope: "dashboards:read" },
  },
  updateDashboardWidget: {
    approval: "approval",
    availability: { scope: "dashboards:CUD" },
  },
  deleteDashboardWidget: {
    approval: "approval",
    availability: { scope: "dashboards:CUD" },
  },
  listDashboards: {
    approval: "auto",
    availability: { scope: "dashboards:read" },
  },
  getDashboard: {
    approval: "auto",
    availability: { scope: "dashboards:read" },
  },
  createDashboard: {
    approval: "approval",
    availability: { scope: "dashboards:CUD" },
  },
  updateDashboard: {
    approval: "approval",
    availability: { scope: "dashboards:CUD" },
  },
  deleteDashboard: {
    approval: "approval",
    availability: { scope: "dashboards:CUD" },
  },
  addDashboardPlacement: {
    approval: "approval",
    availability: { scope: "dashboards:CUD" },
  },
  updateDashboardPlacement: {
    approval: "approval",
    availability: { scope: "dashboards:CUD" },
  },
  deleteDashboardPlacement: {
    approval: "approval",
    availability: { scope: "dashboards:CUD" },
  },
} satisfies Record<string, InAppAgentMcpToolPolicy>;

export type InAppAgentLangfuseMcpToolName =
  keyof typeof IN_APP_AGENT_LANGFUSE_MCP_TOOL_POLICIES;

export const IN_APP_AGENT_LANGFUSE_MCP_TOOL_NAMES =
  new Set<InAppAgentLangfuseMcpToolName>(
    Object.keys(
      IN_APP_AGENT_LANGFUSE_MCP_TOOL_POLICIES,
    ) as InAppAgentLangfuseMcpToolName[],
  );

const IN_APP_AGENT_AUTO_APPROVED_EXTERNAL_TOOL_NAMES = new Set([
  IN_APP_AGENT_REDIRECT_TOOL_NAME,
]);

export const IN_APP_AGENT_SANDBOX_TOOL_NAMES = new Set([
  "read",
  "write",
  "edit",
  "bash",
]);

// Tools in this set can run without a human-in-the-loop approval prompt. Every
// other MCP tool is still exposed to the model, but Mastra suspends execution
// until the user explicitly approves the exact call.
const IN_APP_AGENT_AUTO_APPROVED_TOOL_NAMES = new Set([
  ...Object.entries(IN_APP_AGENT_LANGFUSE_MCP_TOOL_POLICIES)
    .filter(([, policy]) => policy.approval === "auto")
    .map(([toolName]) => `langfuse_${toolName}`),
  ...IN_APP_AGENT_AUTO_APPROVED_EXTERNAL_TOOL_NAMES,
  ...IN_APP_AGENT_SANDBOX_TOOL_NAMES,
]);

export function isMcpToolName(
  input: string,
): input is InAppAgentLangfuseMcpToolName {
  return IN_APP_AGENT_LANGFUSE_MCP_TOOL_NAMES.has(
    input as InAppAgentLangfuseMcpToolName,
  );
}

function isInAppAgentLangfuseMcpToolAvailable(params: {
  toolName: InAppAgentLangfuseMcpToolName;
  userAccess?: InAppAgentUserAccess;
}): boolean {
  if (!params.userAccess) {
    return false;
  }

  const policy = IN_APP_AGENT_LANGFUSE_MCP_TOOL_POLICIES[params.toolName];

  if (!policy) {
    return false;
  }

  return hasProjectAccessByRole({
    role: params.userAccess.projectRole ?? Role.MEMBER,
    admin: params.userAccess.isAdmin,
    scope: policy.availability.scope,
  });
}

export function filterInAppAgentAvailableLangfuseMcpTools<TTool>(params: {
  tools: Partial<Record<InAppAgentLangfuseMcpToolName, TTool>> | undefined;
  userAccess?: InAppAgentUserAccess;
}): Partial<Record<InAppAgentLangfuseMcpToolName, TTool>> {
  return Object.fromEntries(
    Object.entries(params.tools ?? {}).flatMap(([toolName, tool]) => {
      if (!isMcpToolName(toolName)) {
        return [];
      }

      if (
        !isInAppAgentLangfuseMcpToolAvailable({
          toolName,
          userAccess: params.userAccess,
        })
      ) {
        return [];
      }

      return [[toolName, tool] as const];
    }),
  );
}

type InAppAgentTool = object;

export function withInAppAgentToolApproval<TTool extends InAppAgentTool>(
  tools: Record<string, TTool>,
): Record<string, TTool | (TTool & { requireApproval: true })> {
  return Object.fromEntries(
    Object.entries(tools).map(([toolName, tool]) => [
      toolName,
      isInAppAgentAutoApprovedToolName(toolName)
        ? tool
        : { ...tool, requireApproval: true },
    ]),
  ) as Record<string, TTool | (TTool & { requireApproval: true })>;
}

function isInAppAgentAutoApprovedToolName(toolName: string): boolean {
  return (
    toolName.startsWith("langfuseDocs_") ||
    IN_APP_AGENT_AUTO_APPROVED_TOOL_NAMES.has(toolName)
  );
}
