import { createContext, useContext } from "react";

// Role assignments for the template tasks currently on screen, provided by
// TaskBoardPage / TaskDetailPanel in template mode (see useTaskRoles.ts),
// so the assignee cells deep in TaskTable/TaskRow's recursion can show and
// edit roles without every level passing them down.
export interface TemplateRoles {
  rolesByTask: Map<string, string[]>;
  setTaskRoles: (input: { taskId: string; roleIds: string[] }) => void;
}

const TemplateRolesContext = createContext<TemplateRoles | null>(null);

export const TemplateRolesProvider = TemplateRolesContext.Provider;

export function useTemplateRoles(): TemplateRoles | null {
  return useContext(TemplateRolesContext);
}
