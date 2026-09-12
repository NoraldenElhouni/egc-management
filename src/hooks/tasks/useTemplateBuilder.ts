import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../lib/supabaseClient";
import type { Database } from "../../lib/supabase";
import type { Template, TemplateTask } from "./useTemplatePicker";

// =====================================================================
// D8 — Template builder (build plan Part 7).
// =====================================================================
// "Drag-and-drop nesting" per the build plan is replaced here with
// explicit move-up/move-down/indent/outdent buttons — a real, honest
// simplification (no DnD library pulled in for one screen) rather than
// a half-built drag interaction. Reordering swaps sort_order between
// adjacent siblings; indent/outdent re-parents onto the previous
// sibling or the parent's own parent, per ClickUp's own "tab to nest"
// keyboard alternative to dragging.

type TaskType = Database["tasks"]["Tables"]["task_types"]["Row"];
type DepartmentLite = { id: string; name_ar: string | null; name: string };
type SpecializationLite = Database["public"]["Tables"]["specializations"]["Row"];
export type TemplateChecklist = Database["tasks"]["Tables"]["template_checklists"]["Row"];
export type TemplateChecklistItem = Database["tasks"]["Tables"]["template_checklist_items"]["Row"];
export type TemplateRequirement = Database["tasks"]["Tables"]["template_requirements"]["Row"];
type RequirementType = Database["tasks"]["Enums"]["requirement_type"];
type Priority = Database["tasks"]["Enums"]["priority"];

export interface TemplateBuilderData {
  template: Template;
  tasks: TemplateTask[];
  checklistsByTask: Map<string, (TemplateChecklist & { items: TemplateChecklistItem[] })[]>;
  requirementsByTask: Map<string, TemplateRequirement[]>;
  taskTypes: TaskType[];
  departments: DepartmentLite[];
  specializations: SpecializationLite[];
}

export function useTemplateBuilder(templateId: string | undefined) {
  const queryClient = useQueryClient();
  const tasksDb = supabase.schema("tasks");
  const queryKey = ["template-builder", templateId];
  const invalidate = () => queryClient.invalidateQueries({ queryKey });

  const query = useQuery({
    queryKey,
    enabled: !!templateId,
    queryFn: async (): Promise<TemplateBuilderData> => {
      if (!templateId) throw new Error("no template id");

      const [
        { data: template, error: templateError },
        { data: tasks, error: tasksError },
        { data: taskTypes, error: taskTypesError },
        { data: departments, error: departmentsError },
        { data: specializations, error: specializationsError },
      ] = await Promise.all([
        tasksDb.from("templates").select("*").eq("id", templateId).single(),
        tasksDb.from("template_tasks").select("*").eq("template_id", templateId).order("sort_order"),
        tasksDb.from("task_types").select("*").order("name_ar"),
        supabase.from("departments").select("id, name_ar, name").eq("is_active", true),
        supabase.from("specializations").select("*").order("name"),
      ]);
      if (templateError) throw templateError;
      if (tasksError) throw tasksError;
      if (taskTypesError) throw taskTypesError;
      if (departmentsError) throw departmentsError;
      if (specializationsError) throw specializationsError;

      const taskIds = (tasks ?? []).map((t) => t.id);
      const [
        { data: checklists, error: checklistsError },
        { data: requirements, error: requirementsError },
      ] = await Promise.all([
        taskIds.length
          ? tasksDb.from("template_checklists").select("*, template_checklist_items(*)").in("template_task_id", taskIds).order("sort_order")
          : Promise.resolve({ data: [], error: null }),
        taskIds.length
          ? tasksDb.from("template_requirements").select("*").in("template_task_id", taskIds)
          : Promise.resolve({ data: [], error: null }),
      ]);
      if (checklistsError) throw checklistsError;
      if (requirementsError) throw requirementsError;

      const checklistsByTask = new Map<string, (TemplateChecklist & { items: TemplateChecklistItem[] })[]>();
      for (const row of checklists ?? []) {
        const { template_checklist_items, ...checklist } = row as TemplateChecklist & {
          template_checklist_items: TemplateChecklistItem[] | null;
        };
        const list = checklistsByTask.get(checklist.template_task_id) ?? [];
        list.push({ ...checklist, items: template_checklist_items ?? [] });
        checklistsByTask.set(checklist.template_task_id, list);
      }

      const requirementsByTask = new Map<string, TemplateRequirement[]>();
      for (const row of requirements ?? []) {
        const list = requirementsByTask.get(row.template_task_id) ?? [];
        list.push(row);
        requirementsByTask.set(row.template_task_id, list);
      }

      return { template, tasks: tasks ?? [], checklistsByTask, requirementsByTask, taskTypes: taskTypes ?? [], departments: departments ?? [], specializations: specializations ?? [] };
    },
  });

  const addTask = useMutation({
    mutationFn: async ({ parentId, title }: { parentId: string | null; title: string }) => {
      if (!templateId || !query.data) throw new Error("template not loaded");
      const firstTaskType = query.data.taskTypes[0];
      if (!firstTaskType) throw new Error("لا توجد أنواع مهام معرّفة");
      const siblings = query.data.tasks.filter((t) => t.parent_template_task_id === parentId);
      const maxSort = siblings.reduce((m, t) => Math.max(m, t.sort_order), -1);
      const { error } = await tasksDb.from("template_tasks").insert({
        template_id: templateId,
        parent_template_task_id: parentId,
        title,
        title_ar: title,
        task_type_id: firstTaskType.id,
        sort_order: maxSort + 1,
      });
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const updateTask = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<TemplateTask> }) => {
      const { error } = await tasksDb.from("template_tasks").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const deleteTask = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await tasksDb.from("template_tasks").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const moveTask = useMutation({
    mutationFn: async ({ id, direction }: { id: string; direction: "up" | "down" }) => {
      if (!query.data) throw new Error("template not loaded");
      const task = query.data.tasks.find((t) => t.id === id);
      if (!task) return;
      const siblings = query.data.tasks
        .filter((t) => t.parent_template_task_id === task.parent_template_task_id)
        .sort((a, b) => a.sort_order - b.sort_order);
      const index = siblings.findIndex((t) => t.id === id);
      const swapWith = direction === "up" ? siblings[index - 1] : siblings[index + 1];
      if (!swapWith) return;

      const { error: e1 } = await tasksDb.from("template_tasks").update({ sort_order: swapWith.sort_order }).eq("id", task.id);
      if (e1) throw e1;
      const { error: e2 } = await tasksDb.from("template_tasks").update({ sort_order: task.sort_order }).eq("id", swapWith.id);
      if (e2) throw e2;
    },
    onSuccess: invalidate,
  });

  const indentTask = useMutation({
    mutationFn: async (id: string) => {
      if (!query.data) throw new Error("template not loaded");
      const task = query.data.tasks.find((t) => t.id === id);
      if (!task) return;
      const siblings = query.data.tasks
        .filter((t) => t.parent_template_task_id === task.parent_template_task_id)
        .sort((a, b) => a.sort_order - b.sort_order);
      const index = siblings.findIndex((t) => t.id === id);
      const newParent = siblings[index - 1];
      if (!newParent) return; // first sibling has nothing to nest under

      const newParentChildren = query.data.tasks.filter((t) => t.parent_template_task_id === newParent.id);
      const maxSort = newParentChildren.reduce((m, t) => Math.max(m, t.sort_order), -1);
      const { error } = await tasksDb
        .from("template_tasks")
        .update({ parent_template_task_id: newParent.id, sort_order: maxSort + 1 })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const outdentTask = useMutation({
    mutationFn: async (id: string) => {
      if (!query.data) throw new Error("template not loaded");
      const task = query.data.tasks.find((t) => t.id === id);
      if (!task || !task.parent_template_task_id) return; // already top-level
      const parent = query.data.tasks.find((t) => t.id === task.parent_template_task_id);
      const newParentId = parent?.parent_template_task_id ?? null;
      const newSiblings = query.data.tasks.filter((t) => t.parent_template_task_id === newParentId);
      const maxSort = newSiblings.reduce((m, t) => Math.max(m, t.sort_order), -1);
      const { error } = await tasksDb
        .from("template_tasks")
        .update({ parent_template_task_id: newParentId, sort_order: maxSort + 1 })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const addChecklist = useMutation({
    mutationFn: async ({ taskId, name }: { taskId: string; name: string }) => {
      const existing = query.data?.checklistsByTask.get(taskId) ?? [];
      const { error } = await tasksDb
        .from("template_checklists")
        .insert({ template_task_id: taskId, name, sort_order: existing.length });
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const deleteChecklist = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await tasksDb.from("template_checklists").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const addChecklistItem = useMutation({
    mutationFn: async ({ checklistId, content, sortOrder }: { checklistId: string; content: string; sortOrder: number }) => {
      const { error } = await tasksDb
        .from("template_checklist_items")
        .insert({ template_checklist_id: checklistId, content, sort_order: sortOrder });
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const deleteChecklistItem = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await tasksDb.from("template_checklist_items").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const addRequirement = useMutation({
    mutationFn: async ({ taskId, requirementType }: { taskId: string; requirementType: RequirementType }) => {
      const { error } = await tasksDb
        .from("template_requirements")
        .insert({ template_task_id: taskId, requirement_type: requirementType });
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const deleteRequirement = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await tasksDb.from("template_requirements").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  return {
    data: query.data,
    loading: query.isPending,
    error: query.error,
    addTask: addTask.mutateAsync,
    updateTask: updateTask.mutateAsync,
    deleteTask: deleteTask.mutateAsync,
    moveTask: moveTask.mutateAsync,
    indentTask: indentTask.mutateAsync,
    outdentTask: outdentTask.mutateAsync,
    addChecklist: addChecklist.mutateAsync,
    deleteChecklist: deleteChecklist.mutateAsync,
    addChecklistItem: addChecklistItem.mutateAsync,
    deleteChecklistItem: deleteChecklistItem.mutateAsync,
    addRequirement: addRequirement.mutateAsync,
    deleteRequirement: deleteRequirement.mutateAsync,
  };
}

export type { Priority };
