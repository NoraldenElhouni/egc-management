import { useState } from "react";
import { useParams } from "react-router-dom";
import { Loader2, Plus, Trash2, ChevronUp, ChevronDown, ChevronRight, ChevronLeft, Settings2, X } from "lucide-react";
import {
  useTemplateBuilder,
  type TemplateChecklist,
  type TemplateChecklistItem,
  type TemplateRequirement,
  type Priority,
} from "../../../hooks/tasks/useTemplateBuilder";
import type { TemplateTask } from "../../../hooks/tasks/useTemplatePicker";
import type { Database } from "../../../lib/supabase";

// D8 — Template builder (build plan Part 7). See useTemplateBuilder.ts's
// header for why nesting uses move/indent/outdent buttons instead of
// drag-and-drop.

type TaskType = Database["tasks"]["Tables"]["task_types"]["Row"];
type DepartmentLite = { id: string; name_ar: string | null; name: string };
type SpecializationLite = Database["public"]["Tables"]["specializations"]["Row"];

const PRIORITY_LABELS: Record<Priority, string> = {
  urgent: "عاجل",
  high: "مرتفعة",
  normal: "عادية",
  low: "منخفضة",
};

const REQUIREMENT_LABELS: Record<Database["tasks"]["Enums"]["requirement_type"], string> = {
  attachment: "مرفق",
  report: "تقرير",
  approval: "اعتماد",
  checklist_complete: "إكمال قائمة تحقق",
  subtasks_complete: "إكمال المهام الفرعية",
  linked_record: "سجل مرتبط",
};
const REQUIREMENT_TYPES = Object.keys(REQUIREMENT_LABELS) as Database["tasks"]["Enums"]["requirement_type"][];

export default function TemplateBuilderPage() {
  const { templateId } = useParams<{ templateId: string }>();
  const builder = useTemplateBuilder(templateId);
  const { data, loading, error } = builder;
  const [newRootTitle, setNewRootTitle] = useState("");

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center text-gray-400">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }
  if (error || !data) {
    return <div className="flex h-full items-center justify-center text-sm text-red-500">تعذّر تحميل القالب</div>;
  }

  const byParent = new Map<string | null, TemplateTask[]>();
  for (const t of data.tasks) {
    const list = byParent.get(t.parent_template_task_id) ?? [];
    list.push(t);
    byParent.set(t.parent_template_task_id, list);
  }
  const roots = (byParent.get(null) ?? []).sort((a, b) => a.sort_order - b.sort_order);

  const submitRoot = async () => {
    const title = newRootTitle.trim();
    if (!title) return;
    await builder.addTask({ parentId: null, title });
    setNewRootTitle("");
  };

  return (
    <div className="flex h-full flex-col overflow-y-auto" dir="rtl">
      <div className="border-b border-gray-100 px-4 py-3">
        <h1 className="text-base font-semibold text-gray-900">{data.template.name_ar}</h1>
      </div>

      <div className="flex-1 p-4">
        {roots.map((task) => (
          <TaskNode key={task.id} task={task} depth={0} byParent={byParent} builder={builder} data={data} />
        ))}

        <div className="mt-2 flex items-center gap-1.5 px-1 py-1.5">
          <Plus className="h-3.5 w-3.5 text-gray-400" />
          <input
            value={newRootTitle}
            onChange={(e) => setNewRootTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submitRoot()}
            onBlur={submitRoot}
            placeholder="إضافة مهمة رئيسية..."
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-gray-400"
          />
        </div>
      </div>
    </div>
  );
}

interface TaskNodeProps {
  task: TemplateTask;
  depth: number;
  byParent: Map<string | null, TemplateTask[]>;
  builder: ReturnType<typeof useTemplateBuilder>;
  data: {
    taskTypes: TaskType[];
    departments: DepartmentLite[];
    specializations: SpecializationLite[];
    checklistsByTask: Map<string, (TemplateChecklist & { items: TemplateChecklistItem[] })[]>;
    requirementsByTask: Map<string, TemplateRequirement[]>;
  };
}

function TaskNode({ task, depth, byParent, builder, data }: TaskNodeProps) {
  const [expanded, setExpanded] = useState(false);
  const [addingChild, setAddingChild] = useState(false);
  const [childTitle, setChildTitle] = useState("");
  const [newChecklistName, setNewChecklistName] = useState("");
  const children = (byParent.get(task.id) ?? []).sort((a, b) => a.sort_order - b.sort_order);
  const checklists = data.checklistsByTask.get(task.id) ?? [];
  const requirements = data.requirementsByTask.get(task.id) ?? [];

  const submitChild = async () => {
    const title = childTitle.trim();
    if (!title) return;
    await builder.addTask({ parentId: task.id, title });
    setChildTitle("");
    setAddingChild(false);
  };

  const submitChecklist = async () => {
    const name = newChecklistName.trim();
    if (!name) return;
    await builder.addChecklist({ taskId: task.id, name });
    setNewChecklistName("");
  };

  return (
    <div>
      <div
        className="flex flex-wrap items-center gap-1.5 rounded-md py-1.5 hover:bg-gray-50"
        style={{ paddingRight: 4 + depth * 24 }}
      >
        <button onClick={() => setExpanded((v) => !v)} className="shrink-0 text-gray-400 hover:text-gray-600">
          {expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5 rtl:rotate-180" />}
        </button>

        <input
          defaultValue={task.title_ar}
          onBlur={(e) => {
            const value = e.target.value.trim();
            if (value && value !== task.title_ar) builder.updateTask({ id: task.id, patch: { title_ar: value, title: value } });
          }}
          className="min-w-[8rem] flex-1 rounded border border-transparent bg-transparent px-1 py-0.5 text-sm text-gray-800 hover:border-gray-200 focus:border-gray-300 focus:bg-white focus:outline-none"
        />

        <select
          value={task.task_type_id}
          onChange={(e) => builder.updateTask({ id: task.id, patch: { task_type_id: e.target.value } })}
          className="shrink-0 rounded border border-gray-200 bg-white px-1 py-0.5 text-xs text-gray-600"
        >
          {data.taskTypes.map((tt) => (
            <option key={tt.id} value={tt.id}>
              {tt.name_ar}
            </option>
          ))}
        </select>

        <div className="flex shrink-0 items-center gap-0.5">
          <button onClick={() => builder.moveTask({ id: task.id, direction: "up" })} className="text-gray-300 hover:text-gray-600" title="أعلى">
            <ChevronUp className="h-3.5 w-3.5" />
          </button>
          <button onClick={() => builder.moveTask({ id: task.id, direction: "down" })} className="text-gray-300 hover:text-gray-600" title="أسفل">
            <ChevronDown className="h-3.5 w-3.5" />
          </button>
          <button onClick={() => builder.indentTask(task.id)} className="text-gray-300 hover:text-gray-600" title="اجعلها فرعية للمهمة السابقة">
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <button onClick={() => builder.outdentTask(task.id)} className="text-gray-300 hover:text-gray-600" title="ارفعها لمستوى أعلى">
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <button
          onClick={() => setAddingChild(true)}
          className="shrink-0 rounded p-0.5 text-gray-400 hover:bg-gray-200 hover:text-gray-600"
          title="إضافة مهمة فرعية"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={() => confirm(`حذف "${task.title_ar}" وكل ما تحتها؟`) && builder.deleteTask(task.id)}
          className="shrink-0 rounded p-0.5 text-gray-300 hover:bg-red-50 hover:text-red-500"
          title="حذف"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {expanded && (
        <div
          className="mb-2 space-y-3 rounded-md border border-gray-100 bg-gray-50/50 p-3 text-sm"
          style={{ marginRight: 4 + depth * 24 + 20 }}
        >
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Field label="القسم">
              <select
                value={task.department_id ?? ""}
                onChange={(e) => builder.updateTask({ id: task.id, patch: { department_id: e.target.value || null } })}
                className="w-full rounded border border-gray-200 px-1.5 py-1 text-xs"
              >
                <option value="">بدون</option>
                {data.departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name_ar ?? d.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="التخصص">
              <select
                value={task.specialization_id ?? ""}
                onChange={(e) => builder.updateTask({ id: task.id, patch: { specialization_id: e.target.value || null } })}
                className="w-full rounded border border-gray-200 px-1.5 py-1 text-xs"
              >
                <option value="">بدون</option>
                {data.specializations.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="الأولوية">
              <select
                value={task.priority ?? ""}
                onChange={(e) => builder.updateTask({ id: task.id, patch: { priority: (e.target.value || null) as Priority | null } })}
                className="w-full rounded border border-gray-200 px-1.5 py-1 text-xs"
              >
                <option value="">بدون</option>
                {(Object.keys(PRIORITY_LABELS) as Priority[]).map((p) => (
                  <option key={p} value={p}>
                    {PRIORITY_LABELS[p]}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="تقدير الوقت (دقيقة)">
              <input
                type="number"
                defaultValue={task.time_estimate_minutes ?? ""}
                onBlur={(e) =>
                  builder.updateTask({
                    id: task.id,
                    patch: { time_estimate_minutes: e.target.value ? Number(e.target.value) : null },
                  })
                }
                className="w-full rounded border border-gray-200 px-1.5 py-1 text-xs"
              />
            </Field>
            <Field label="إزاحة البداية (يوم)">
              <input
                type="number"
                defaultValue={task.relative_start_offset_days ?? ""}
                onBlur={(e) =>
                  builder.updateTask({
                    id: task.id,
                    patch: { relative_start_offset_days: e.target.value ? Number(e.target.value) : null },
                  })
                }
                className="w-full rounded border border-gray-200 px-1.5 py-1 text-xs"
              />
            </Field>
            <Field label="إزاحة الاستحقاق (يوم)">
              <input
                type="number"
                defaultValue={task.relative_due_offset_days ?? ""}
                onBlur={(e) =>
                  builder.updateTask({
                    id: task.id,
                    patch: { relative_due_offset_days: e.target.value ? Number(e.target.value) : null },
                  })
                }
                className="w-full rounded border border-gray-200 px-1.5 py-1 text-xs"
              />
            </Field>
          </div>

          <div>
            <div className="mb-1 flex items-center gap-1 text-xs font-semibold text-gray-500">
              <Settings2 className="h-3 w-3" /> قوائم التحقق
            </div>
            {checklists.map((cl) => (
              <div key={cl.id} className="mb-1.5 rounded border border-gray-200 bg-white p-2">
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-700">{cl.name}</span>
                  <button onClick={() => builder.deleteChecklist(cl.id)} className="text-gray-300 hover:text-red-500">
                    <X className="h-3 w-3" />
                  </button>
                </div>
                {cl.items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between py-0.5 text-xs text-gray-600">
                    <span>· {item.content}</span>
                    <button onClick={() => builder.deleteChecklistItem(item.id)} className="text-gray-300 hover:text-red-500">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                <ChecklistItemInput
                  onAdd={(content) => builder.addChecklistItem({ checklistId: cl.id, content, sortOrder: cl.items.length })}
                />
              </div>
            ))}
            <div className="flex items-center gap-1.5">
              <input
                value={newChecklistName}
                onChange={(e) => setNewChecklistName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submitChecklist()}
                placeholder="+ قائمة تحقق جديدة"
                className="flex-1 rounded border border-gray-200 bg-white px-1.5 py-1 text-xs outline-none"
              />
            </div>
          </div>

          <div>
            <div className="mb-1 text-xs font-semibold text-gray-500">المتطلبات</div>
            <div className="flex flex-wrap gap-1.5">
              {requirements.map((req) => (
                <span
                  key={req.id}
                  className="flex items-center gap-1 rounded-full bg-white px-2 py-0.5 text-xs text-gray-600 ring-1 ring-gray-200"
                >
                  {REQUIREMENT_LABELS[req.requirement_type]}
                  <button onClick={() => builder.deleteRequirement(req.id)} className="text-gray-300 hover:text-red-500">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
              <select
                value=""
                onChange={(e) => {
                  if (e.target.value)
                    builder.addRequirement({
                      taskId: task.id,
                      requirementType: e.target.value as Database["tasks"]["Enums"]["requirement_type"],
                    });
                }}
                className="rounded-full border border-dashed border-gray-300 bg-white px-2 py-0.5 text-xs text-gray-400"
              >
                <option value="">+ إضافة متطلب</option>
                {REQUIREMENT_TYPES.map((rt) => (
                  <option key={rt} value={rt}>
                    {REQUIREMENT_LABELS[rt]}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {children.map((child) => (
        <TaskNode key={child.id} task={child} depth={depth + 1} byParent={byParent} builder={builder} data={data} />
      ))}

      {addingChild && (
        <div className="flex items-center gap-1.5 py-1" style={{ paddingRight: 4 + (depth + 1) * 24 }}>
          <Plus className="h-3.5 w-3.5 text-gray-400" />
          <input
            autoFocus
            value={childTitle}
            onChange={(e) => setChildTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") submitChild();
              if (e.key === "Escape") {
                setChildTitle("");
                setAddingChild(false);
              }
            }}
            onBlur={submitChild}
            placeholder="عنوان المهمة الفرعية..."
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-gray-400"
          />
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-0.5 block text-[10px] text-gray-400">{label}</span>
      {children}
    </label>
  );
}

function ChecklistItemInput({ onAdd }: { onAdd: (content: string) => void }) {
  const [value, setValue] = useState("");
  const submit = () => {
    const content = value.trim();
    if (!content) return;
    onAdd(content);
    setValue("");
  };
  return (
    <input
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onKeyDown={(e) => e.key === "Enter" && submit()}
      onBlur={submit}
      placeholder="+ بند جديد"
      className="mt-1 w-full rounded border border-gray-100 bg-gray-50 px-1.5 py-1 text-xs outline-none"
    />
  );
}
