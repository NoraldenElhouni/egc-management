import { useMemo, useRef, useState } from "react";
import { Plus, MoreHorizontal, ChevronsDown, ChevronsUp } from "lucide-react";
import TaskRow, { rowGridStyle } from "./TaskRow";
import ColumnEditorModal from "./ColumnEditorModal";
import { useClickOutside } from "../../../hooks/tasks/useClickOutside";
import type {
  CustomColumn,
  FieldType,
  Priority,
  StatusRow,
  TaskRow as TaskRowType,
  TaskTypeLite,
  TagLite,
} from "../../../hooks/tasks/useTaskBoard";
import type { AssignablePerson } from "../../../hooks/tasks/useAssignablePeople";
import type { SpaceFeatureSettings } from "../../../hooks/tasks/useSpaceSettings";
import type { Json } from "../../../lib/supabase";

type GroupBy = "none" | "department" | "assignee" | "task_type" | "zone";

const GROUP_LABELS: Record<GroupBy, string> = {
  none: "بدون تجميع",
  zone: "المنطقة",
  department: "القسم",
  assignee: "الموظف المسؤول",
  task_type: "نوع المهمة",
};

interface TaskTableProps {
  boardId: string;
  boardZoneId: string | null;
  zoneName: string | null;
  tasks: TaskRowType[];
  statuses: StatusRow[];
  employeesById: Map<string, AssignablePerson>;
  allEmployees: AssignablePerson[];
  assigneesByTask: Map<string, string[]>;
  taskTypes: Map<string, TaskTypeLite>;
  departmentNamesById: Map<string, string>;
  linkedTaskIds: Set<string>;
  blockedTaskIds: Set<string>;
  unmetRequirementTaskIds: Set<string>;
  attachedTaskIds: Set<string>;
  commentedTaskIds: Set<string>;
  tagsByTask: Map<string, TagLite[]>;
  subtaskProgressByTask: Map<string, { done: number; total: number }>;
  customColumns: CustomColumn[];
  hiddenColumns: CustomColumn[];
  valuesByTask: Map<string, Map<string, Json>>;
  featureSettings: SpaceFeatureSettings;
  onChangeStatus: (taskId: string, statusId: string) => void;
  onChangeTaskType: (taskId: string, taskTypeId: string) => void;
  onChangePriority: (taskId: string, priority: Priority | null) => void;
  onChangeStartDate: (taskId: string, date: string | null) => void;
  onChangeDueDate: (taskId: string, date: string | null) => void;
  onChangeAssignees: (taskId: string, userIds: string[]) => void;
  onCreateTask: (title: string, parentTaskId: string | null) => void;
  onChangeValue: (taskId: string, fieldDefinitionId: string, value: Json) => void;
  onAttachField: (fieldDefinitionId: string) => void;
  onCreateAndAttachField: (input: { name: string; name_ar: string; type: FieldType; config: Json }) => void;
  onDetachColumn: (boardColumnId: string) => void;
  onSetColumnVisibility: (boardColumnId: string, visible: boolean) => void;
  onRenameField: (fieldDefinitionId: string, name_ar: string) => void;
  onMoveTaskTo: (input: { id: string; newParentId: string | null; beforeId: string | null }) => void;
}

export default function TaskTable({
  boardId,
  boardZoneId,
  zoneName,
  tasks,
  statuses,
  employeesById,
  allEmployees,
  assigneesByTask,
  taskTypes,
  departmentNamesById,
  linkedTaskIds,
  blockedTaskIds,
  unmetRequirementTaskIds,
  attachedTaskIds,
  commentedTaskIds,
  tagsByTask,
  subtaskProgressByTask,
  customColumns,
  hiddenColumns,
  valuesByTask,
  featureSettings,
  onChangeStatus,
  onChangeTaskType,
  onChangePriority,
  onChangeStartDate,
  onChangeDueDate,
  onChangeAssignees,
  onCreateTask,
  onChangeValue,
  onAttachField,
  onCreateAndAttachField,
  onDetachColumn,
  onSetColumnVisibility,
  onRenameField,
  onMoveTaskTo,
}: TaskTableProps) {
  const [groupBy, setGroupBy] = useState<GroupBy>("none");
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set());
  const hasSeededCollapse = useRef(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [showColumnEditor, setShowColumnEditor] = useState(false);
  const [draggedId, setDraggedId] = useState<string | null>(null);

  const childrenByParent = useMemo(() => {
    const map = new Map<string | null, TaskRowType[]>();
    for (const t of tasks) {
      const key = t.parent_task_id;
      const list = map.get(key) ?? [];
      list.push(t);
      map.set(key, list);
    }
    return map;
  }, [tasks]);

  // Seed the collapsed set exactly once per board (the parent remounts
  // this component with key={boardId}) — every task with subtasks starts
  // collapsed, at every depth, not just nested ones: a top-level task's
  // own subtasks used to show open by default, which made a board full
  // of them just as noisy as no collapsing at all. Guarded by a ref
  // rather than "is collapsedIds empty" so that a user expanding every
  // row back to an empty set doesn't get re-collapsed by the next
  // mutation's refetch.
  if (!hasSeededCollapse.current && tasks.length > 0) {
    hasSeededCollapse.current = true;
    const initial = new Set(tasks.filter((t) => childrenByParent.has(t.id)).map((t) => t.id));
    if (initial.size > 0) setCollapsedIds(initial);
  }

  const toggleCollapse = (taskId: string) => {
    setCollapsedIds((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) next.delete(taskId);
      else next.add(taskId);
      return next;
    });
  };

  const collapseAll = () => {
    setCollapsedIds(new Set(tasks.filter((t) => childrenByParent.has(t.id)).map((t) => t.id)));
  };
  const expandAll = () => setCollapsedIds(new Set());

  const topLevel = childrenByParent.get(null) ?? [];

  const groups = useMemo(() => {
    if (groupBy === "none") return [{ key: "all", label: null, tasks: topLevel }];

    const groupKey = (t: TaskRowType): { key: string; label: string | null } => {
      switch (groupBy) {
        case "zone": {
          if (!t.zone_id) return { key: "none", label: "بدون منطقة" };
          if (t.zone_id === boardZoneId) {
            return { key: t.zone_id, label: zoneName ?? "المنطقة الحالية" };
          }
          return { key: t.zone_id, label: "منطقة أخرى" };
        }
        case "department":
          return t.department_id
            ? { key: t.department_id, label: departmentNamesById.get(t.department_id) ?? "قسم" }
            : { key: "none", label: "بدون قسم" };
        case "assignee": {
          const ids = assigneesByTask.get(t.id) ?? [];
          if (ids.length === 0) return { key: "none", label: "غير معين" };
          const first = employeesById.get(ids[0]);
          return {
            key: ids[0],
            label: first ? `${first.first_name} ${first.last_name ?? ""}` : "موظف",
          };
        }
        case "task_type": {
          const type = taskTypes.get(t.task_type_id);
          return { key: t.task_type_id, label: type?.name_ar ?? "نوع" };
        }
        default:
          return { key: "all", label: null };
      }
    };

    const map = new Map<string, { label: string | null; tasks: TaskRowType[] }>();
    for (const t of topLevel) {
      const { key, label } = groupKey(t);
      const entry = map.get(key) ?? { label, tasks: [] };
      entry.tasks.push(t);
      map.set(key, entry);
    }
    return Array.from(map.entries()).map(([key, v]) => ({ key, label: v.label, tasks: v.tasks }));
  }, [groupBy, topLevel, boardZoneId, zoneName, departmentNamesById, assigneesByTask, employeesById, taskTypes]);

  const submitNewTask = () => {
    const title = newTaskTitle.trim();
    if (!title) return;
    onCreateTask(title, null);
    setNewTaskTitle("");
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-gray-100 px-4 py-2">
        <select
          value={groupBy}
          onChange={(e) => setGroupBy(e.target.value as GroupBy)}
          className="rounded-md border border-gray-200 bg-white px-2 py-1 text-sm text-gray-600 outline-none"
        >
          {(Object.keys(GROUP_LABELS) as GroupBy[])
            .filter((g) => g !== "task_type" || featureSettings.task_types)
            .map((g) => (
              <option key={g} value={g}>
                {GROUP_LABELS[g]}
              </option>
            ))}
        </select>
        <div className="flex items-center gap-1.5">
          <button
            onClick={expandAll}
            className="flex items-center gap-1 rounded-md border border-gray-200 px-2 py-1 text-xs text-gray-600 hover:bg-gray-50"
          >
            <ChevronsDown className="h-3.5 w-3.5" />
            توسيع الكل
          </button>
          <button
            onClick={collapseAll}
            className="flex items-center gap-1 rounded-md border border-gray-200 px-2 py-1 text-xs text-gray-600 hover:bg-gray-50"
          >
            <ChevronsUp className="h-3.5 w-3.5" />
            طي الكل
          </button>
        </div>
      </div>

      <div
        style={rowGridStyle(customColumns.length, featureSettings.priorities)}
        className="sticky top-0 z-10 border-b border-gray-200 bg-gray-50 px-2 py-2 text-xs font-semibold text-gray-500"
      >
        <div>عنوان المهمة</div>
        <div>الحالة</div>
        {featureSettings.priorities && <div>الأولوية</div>}
        <div>الفريق</div>
        <div>تاريخ البدء</div>
        <div>الاستحقاق</div>
        <div>القسم</div>
        {customColumns.map((col) => (
          <CustomColumnHeader
            key={col.boardColumnId}
            column={col}
            onRename={(name_ar) => onRenameField(col.fieldDefinitionId, name_ar)}
            onDetach={() => onDetachColumn(col.boardColumnId)}
            onHide={() => onSetColumnVisibility(col.boardColumnId, false)}
          />
        ))}
        <button
          onClick={() => setShowColumnEditor(true)}
          title="إضافة عمود"
          className="flex items-center justify-center text-gray-300 hover:text-gray-500"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>

      {showColumnEditor && (
        <ColumnEditorModal
          attachedFieldIds={new Set(customColumns.map((c) => c.fieldDefinitionId))}
          hiddenColumns={hiddenColumns}
          onAttach={(fieldId) => {
            onAttachField(fieldId);
            setShowColumnEditor(false);
          }}
          onCreate={(input) => {
            onCreateAndAttachField({ ...input, config: input.config as Json });
            setShowColumnEditor(false);
          }}
          onUnhide={(boardColumnId) => onSetColumnVisibility(boardColumnId, true)}
          onClose={() => setShowColumnEditor(false)}
        />
      )}

      <div className="flex-1 overflow-y-auto">
        {groups.map((group) => (
          <div key={group.key}>
            {group.label && (
              <div className="border-b border-gray-100 bg-gray-50/60 px-3 py-1.5 text-xs font-medium text-gray-500">
                {group.label}{" "}
                <span className="text-gray-400">({group.tasks.length})</span>
              </div>
            )}
            {group.tasks.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                boardId={boardId}
                depth={0}
                childrenByParent={childrenByParent}
                collapsedIds={collapsedIds}
                onToggleCollapse={toggleCollapse}
                statuses={statuses}
                employeesById={employeesById}
                allEmployees={allEmployees}
                assigneesByTask={assigneesByTask}
                taskTypes={taskTypes}
                departmentNamesById={departmentNamesById}
                linkedTaskIds={linkedTaskIds}
                blockedTaskIds={blockedTaskIds}
                unmetRequirementTaskIds={unmetRequirementTaskIds}
                attachedTaskIds={attachedTaskIds}
                commentedTaskIds={commentedTaskIds}
                tagsByTask={tagsByTask}
                subtaskProgressByTask={subtaskProgressByTask}
                customColumns={customColumns}
                valuesByTask={valuesByTask}
                showPriority={featureSettings.priorities}
                showTaskType={featureSettings.task_types}
                onChangeStatus={onChangeStatus}
                onChangeTaskType={onChangeTaskType}
                onChangePriority={onChangePriority}
                onChangeStartDate={onChangeStartDate}
                onChangeDueDate={onChangeDueDate}
                onChangeAssignees={onChangeAssignees}
                onCreateTask={onCreateTask}
                onChangeValue={onChangeValue}
                draggedId={draggedId}
                onDragStart={setDraggedId}
                onDragEnd={() => setDraggedId(null)}
                onMoveTaskTo={onMoveTaskTo}
              />
            ))}
          </div>
        ))}

        {tasks.length === 0 && (
          <div className="p-6 text-center text-sm text-gray-400">
            لا توجد مهام في هذه اللوحة بعد
          </div>
        )}

        <div className="flex items-center gap-2 border-b border-gray-100 px-3 py-2">
          <Plus className="h-3.5 w-3.5 text-gray-400" />
          <input
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") submitNewTask();
              if (e.key === "Escape") setNewTaskTitle("");
            }}
            onBlur={submitNewTask}
            placeholder="إضافة مهمة..."
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-gray-400"
          />
        </div>
      </div>
    </div>
  );
}

const FIELD_TYPE_LABELS: Record<CustomColumn["type"], string> = {
  text: "نص",
  long_text: "نص طويل",
  number: "رقم",
  currency: "عملة",
  date: "تاريخ",
  select: "اختيار واحد",
  multi_select: "اختيار متعدد",
  user: "مستخدم",
  checkbox: "مربع اختيار",
  url: "رابط",
  email: "بريد إلكتروني",
  phone: "هاتف",
  formula: "معادلة",
  relationship: "علاقة",
};

// The fixed built-in columns (status/priority/assignee/date/department)
// aren't backed by field_definitions, so there's nothing for a "···" on
// them to actually edit/hide/delete — only attached custom columns get
// one, and it does something real (rename the shared field, or detach
// this column from just this board, which build plan §4.11 confirms is
// non-destructive since task_values survive it). "Hide" is reversible —
// setColumnVisibility just flips is_visible, and the "+" modal's hidden-
// columns list is the only way back, so both must ship together.
function CustomColumnHeader({
  column,
  onRename,
  onDetach,
  onHide,
}: {
  column: CustomColumn;
  onRename: (name_ar: string) => void;
  onDetach: () => void;
  onHide: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [nameDraft, setNameDraft] = useState(column.name_ar);
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, () => {
    setOpen(false);
    setRenaming(false);
  });

  if (renaming) {
    return (
      <input
        autoFocus
        value={nameDraft}
        onChange={(e) => setNameDraft(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
        onBlur={() => {
          const value = nameDraft.trim();
          if (value && value !== column.name_ar) onRename(value);
          setRenaming(false);
        }}
        className="w-full rounded border border-gray-300 bg-white px-1 py-0.5 text-xs outline-none"
      />
    );
  }

  return (
    <div ref={ref} className="relative flex items-center justify-between gap-1">
      <span className="truncate" title={FIELD_TYPE_LABELS[column.type]}>
        {column.name_ar}
        <span className="mr-1 text-[10px] font-normal text-gray-400">({FIELD_TYPE_LABELS[column.type]})</span>
      </span>
      <button onClick={() => setOpen((v) => !v)} className="shrink-0 text-gray-300 hover:text-gray-500">
        <MoreHorizontal className="h-3 w-3" />
      </button>
      {open && (
        <div className="absolute left-0 top-full z-30 mt-1 w-32 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
          <button
            onClick={() => {
              setRenaming(true);
              setOpen(false);
            }}
            className="block w-full px-3 py-1.5 text-right text-xs hover:bg-gray-50"
          >
            تعديل الاسم
          </button>
          <button
            onClick={() => {
              onHide();
              setOpen(false);
            }}
            className="block w-full px-3 py-1.5 text-right text-xs hover:bg-gray-50"
          >
            إخفاء العمود
          </button>
          <button onClick={onDetach} className="block w-full px-3 py-1.5 text-right text-xs text-red-500 hover:bg-red-50">
            إزالة العمود
          </button>
        </div>
      )}
    </div>
  );
}
