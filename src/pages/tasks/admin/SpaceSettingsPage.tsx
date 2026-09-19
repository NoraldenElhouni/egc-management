import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Loader2, Plus, Trash2, X } from "lucide-react";
import { DndContext, type DragEndEvent, closestCenter, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, arrayMove, verticalListSortingStrategy } from "@dnd-kit/sortable";
import SortableRow from "../../../components/operations/boq/SortableRow";
import {
  useSpaceSettings,
  DEFAULT_FEATURE_SETTINGS,
  type SpaceFeatureSettings,
  type StatusRow,
} from "../../../hooks/tasks/useSpaceSettings";
import {
  useSpaceAutomations,
  type TriggerType,
  type ActionType,
  type Automation,
} from "../../../hooks/tasks/useSpaceAutomations";
import { useDepartmentOptions, useProjectZoneOptions } from "../../../hooks/tasks/useCreateTaskEntities";
import type { Priority } from "../../../hooks/tasks/useTaskBoard";
import type { Database, Json } from "../../../lib/supabase";

// D9 — Space settings + D10 — Automations (build plan Part 7). See
// useSpaceSettings.ts and useSpaceAutomations.ts headers for scoping
// decisions (status-set ownership, space-only automation scope) and
// useSpaceAutomations.ts's header for the big one: there is no
// execution engine yet, so a rule created and turned on here is stored
// correctly but nothing fires it today.

type AccessLevel = Database["tasks"]["Enums"]["access_level"];
type StatusCategory = Database["tasks"]["Enums"]["status_category"];

const ACCESS_LABELS: Record<AccessLevel, string> = {
  view: "عرض",
  comment: "تعليق",
  edit: "تعديل",
  full: "كامل",
};

const CATEGORY_LABELS: Record<StatusCategory, string> = {
  not_started: "لم يبدأ",
  active: "قيد التنفيذ",
  done: "منجز",
  closed: "مغلق",
};

const TRIGGER_LABELS: Record<TriggerType, string> = {
  status_changed: "عند تغيير الحالة",
  task_created: "عند إنشاء مهمة",
  due_date_arrives: "عند حلول تاريخ الاستحقاق",
  field_changed: "عند تغيير حقل",
  assignee_changed: "عند تغيير المسؤول",
  all_subtasks_complete: "عند إكمال كل المهام الفرعية",
  dependency_cleared: "عند تحرر الاعتماد",
  linked_record_changed: "عند تغيير سجل مرتبط",
};

const ACTION_LABELS: Record<ActionType, string> = {
  set_status: "تغيير الحالة",
  set_assignee: "تعيين مسؤول",
  set_priority: "تغيير الأولوية",
  post_comment: "إضافة تعليق",
  move_task: "نقل المهمة",
  create_task: "إنشاء مهمة",
  send_notification: "إرسال إشعار",
  apply_template: "تطبيق قالب",
};

const PRIORITY_LABELS: Record<Priority, string> = {
  urgent: "عاجل",
  high: "مرتفعة",
  normal: "عادية",
  low: "منخفضة",
};

// Same palette FieldsAdminPage's OPTION_COLORS uses for field/tag options —
// kept as its own local copy rather than a shared import since every other
// screen in this module already keeps its default-color set to itself.
const SPACE_COLOR_PRESETS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#06B6D4", "#EC4899", "#6B7280"];

const RUN_STATUS_STYLE: Record<Database["tasks"]["Enums"]["automation_run_status"], string> = {
  success: "bg-green-50 text-green-600",
  failed: "bg-red-50 text-red-600",
  skipped: "bg-gray-100 text-gray-500",
};

type Tab = "general" | "boards" | "members" | "statuses" | "features" | "automations";

const TABS: { key: Tab; label: string }[] = [
  { key: "general", label: "عام" },
  { key: "boards", label: "اللوحات" },
  { key: "members", label: "الأعضاء" },
  { key: "statuses", label: "الحالات" },
  { key: "features", label: "الميزات" },
  { key: "automations", label: "الأتمتة" },
];

export default function SpaceSettingsPage() {
  const { spaceId } = useParams<{ spaceId: string }>();
  const [tab, setTab] = useState<Tab>("general");
  const settings = useSpaceSettings(spaceId);
  const { data, loading, error } = settings;

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center text-gray-400">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }
  if (error || !data) {
    return <div className="flex h-full items-center justify-center text-sm text-red-500">تعذّر تحميل إعدادات المساحة</div>;
  }

  return (
    <div className="flex h-full flex-col overflow-y-auto" dir="rtl">
      <div className="border-b border-gray-100 px-4 py-3">
        <h1 className="text-base font-semibold text-gray-900">إعدادات {data.space.name}</h1>
      </div>

      <div className="flex gap-1 border-b border-gray-100 px-4">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`border-b-2 px-3 py-2 text-sm ${
              tab === t.key ? "border-primary font-medium text-primary" : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex-1 p-4">
        {tab === "general" && <GeneralTab settings={settings} />}
        {tab === "boards" && <BoardsTab settings={settings} />}
        {tab === "members" && <MembersTab settings={settings} />}
        {tab === "statuses" && <StatusesTab settings={settings} />}
        {tab === "features" && <FeaturesTab settings={settings} />}
        {tab === "automations" && spaceId && <AutomationsTab spaceId={spaceId} statuses={data.statuses} />}
      </div>
    </div>
  );
}

function GeneralTab({ settings }: { settings: ReturnType<typeof useSpaceSettings> }) {
  const { data, updateSpace, archiveSpace } = settings;
  const navigate = useNavigate();
  if (!data) return null;
  const isPersonal = data.space.space_type === "personal";

  const handleArchive = async () => {
    if (!confirm(`أرشفة مساحة "${data.space.name}"؟ ستختفي من الشريط الجانبي وصفحة المهام — لوحاتها ومهامها تبقى محفوظة ولا تُحذف.`)) {
      return;
    }
    await archiveSpace();
    navigate("/tasks");
  };

  return (
    <div className="max-w-md space-y-4">
      <label className="block">
        <span className="mb-1 block text-xs font-semibold text-gray-500">الاسم</span>
        <input
          defaultValue={data.space.name}
          onBlur={(e) => e.target.value.trim() && e.target.value !== data.space.name && updateSpace({ name: e.target.value.trim() })}
          className="w-full rounded-md border border-gray-200 px-2 py-1.5 text-sm outline-none"
        />
      </label>
      <label className="block">
        <span className="mb-1 block text-xs font-semibold text-gray-500">الوصف</span>
        <textarea
          defaultValue={data.space.description ?? ""}
          onBlur={(e) => updateSpace({ description: e.target.value || null })}
          rows={3}
          className="w-full rounded-md border border-gray-200 px-2 py-1.5 text-sm outline-none"
        />
      </label>
      <div>
        <span className="mb-1 block text-xs font-semibold text-gray-500">النوع</span>
        <span className="text-sm text-gray-600">
          {{ project: "مشروع", department: "قسم", company: "شركة", personal: "شخصية" }[data.space.space_type]}
        </span>
      </div>
      <div>
        <span className="mb-1 block text-xs font-semibold text-gray-500">اللون</span>
        <div className="flex flex-wrap items-center gap-1.5">
          {SPACE_COLOR_PRESETS.map((hex) => (
            <button
              key={hex}
              type="button"
              onClick={() => updateSpace({ color: hex })}
              style={{ background: hex }}
              title={hex}
              className={`h-6 w-6 shrink-0 rounded-full transition-transform hover:scale-110 ${
                data.space.color === hex ? "ring-2 ring-offset-2 ring-gray-400" : ""
              }`}
            />
          ))}
        </div>
        <div className="mt-2 flex items-center gap-2">
          <input
            key={data.space.color ?? "none"}
            type="color"
            defaultValue={data.space.color ?? "#64748B"}
            onBlur={(e) => e.target.value !== data.space.color && updateSpace({ color: e.target.value })}
            className="h-8 w-8 shrink-0 cursor-pointer rounded border-0"
          />
          {data.space.color && (
            <button
              type="button"
              onClick={() => updateSpace({ color: null })}
              className="text-xs text-gray-400 hover:text-gray-600"
            >
              إزالة اللون
            </button>
          )}
        </div>
      </div>
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={data.space.visibility === "public"}
          disabled={isPersonal}
          onChange={(e) => updateSpace({ visibility: e.target.checked ? "public" : "private" })}
          className="h-3.5 w-3.5"
        />
        <span className="text-sm text-gray-700">مساحة عامة (يراها الجميع)</span>
      </label>
      {isPersonal && <p className="text-xs text-gray-400">المساحات الشخصية تبقى خاصة دائماً ولا تقبل أعضاء.</p>}

      <div className="rounded-md border border-red-100 bg-red-50/50 p-3">
        <div className="mb-1.5 text-xs font-semibold text-red-600">منطقة الخطر</div>
        <button
          onClick={handleArchive}
          className="flex items-center gap-1.5 text-sm font-medium text-red-600 hover:text-red-700"
        >
          <Trash2 className="h-3.5 w-3.5" />
          أرشفة هذه المساحة
        </button>
      </div>
    </div>
  );
}

function FoldersList({ settings }: { settings: ReturnType<typeof useSpaceSettings> }) {
  const { data, renameFolder, archiveFolder } = settings;
  if (!data || data.folders.length === 0) return null;

  const handleArchive = (id: string, name: string, boardCount: number) => {
    const warning = boardCount > 0 ? ` لوحاته الـ${boardCount} ستنتقل لتظهر مباشرة تحت المساحة (بدون مجلد).` : "";
    if (confirm(`أرشفة مجلد "${name}"؟${warning}`)) archiveFolder(id);
  };

  return (
    <div className="mb-4">
      <div className="mb-1.5 text-xs font-semibold text-gray-500">المجلدات</div>
      <div className="divide-y divide-gray-100 rounded-lg border border-gray-100">
        {data.folders.map((f) => (
          <div key={f.id} className="flex items-center gap-2 px-3 py-2 text-sm">
            <input
              defaultValue={f.name}
              onBlur={(e) => {
                const value = e.target.value.trim();
                if (value && value !== f.name) renameFolder({ id: f.id, name: value });
              }}
              className="min-w-[8rem] flex-1 rounded border border-transparent bg-transparent px-1 py-0.5 font-medium text-gray-800 hover:border-gray-200 focus:border-gray-300 focus:outline-none"
            />
            <span className="text-xs text-gray-400">{f.boardCount} لوحة</span>
            <button onClick={() => handleArchive(f.id, f.name, f.boardCount)} className="text-gray-300 hover:text-red-500">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function BoardsTab({ settings }: { settings: ReturnType<typeof useSpaceSettings> }) {
  const { data, updateBoard, deleteBoard, reorderBoards } = settings;
  const departments = useDepartmentOptions();
  const zones = useProjectZoneOptions(data?.space.project_id);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));
  if (!data) return null;

  const handleDelete = (boardId: string, name: string, taskCount: number) => {
    const warning = taskCount > 0 ? ` تحتوي على ${taskCount} مهمة ستُحذف معها.` : "";
    if (confirm(`حذف لوحة "${name}"؟${warning}`)) deleteBoard(boardId);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = data.boards.findIndex((b) => b.id === active.id);
    const newIndex = data.boards.findIndex((b) => b.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const reordered = arrayMove(data.boards, oldIndex, newIndex);
    reorderBoards(reordered.map((b, i) => ({ id: b.id, sortOrder: i })));
  };

  return (
    <div className="max-w-3xl space-y-2">
      <FoldersList settings={settings} />
      {data.boards.length === 0 ? (
        <p className="text-sm text-gray-400">لا توجد لوحات في هذه المساحة بعد.</p>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={data.boards.map((b) => b.id)} strategy={verticalListSortingStrategy}>
            <div className="divide-y divide-gray-100 rounded-lg border border-gray-100">
              {data.boards.map((b) => (
                <SortableRow key={b.id} id={b.id} className="px-1 py-1">
                  <div className="flex flex-wrap items-center gap-2 px-2 py-1 text-sm">
                    <input
                      defaultValue={b.name}
                      onBlur={(e) => {
                        const value = e.target.value.trim();
                        if (value && value !== b.name) updateBoard({ id: b.id, patch: { name: value } });
                      }}
                      className="min-w-[8rem] flex-1 rounded border border-transparent bg-transparent px-1 py-0.5 font-medium text-gray-800 hover:border-gray-200 focus:border-gray-300 focus:outline-none"
                    />

                    {data.space.project_id ? (
                      <select
                        value={b.zoneId ?? ""}
                        onChange={(e) => updateBoard({ id: b.id, patch: { zone_id: e.target.value || null } })}
                        className="rounded border border-gray-200 px-1.5 py-1 text-xs text-gray-600"
                      >
                        <option value="">بدون منطقة</option>
                        {zones.map((z) => (
                          <option key={z.id} value={z.id}>
                            {z.name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-xs text-gray-300">—</span>
                    )}

                    <select
                      value={b.departmentId ?? ""}
                      onChange={(e) => updateBoard({ id: b.id, patch: { department_id: e.target.value || null } })}
                      className="rounded border border-gray-200 px-1.5 py-1 text-xs text-gray-600"
                    >
                      <option value="">بدون قسم افتراضي</option>
                      {departments.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name_ar ?? d.name}
                        </option>
                      ))}
                    </select>

                    <select
                      value={b.folderId ?? ""}
                      onChange={(e) => updateBoard({ id: b.id, patch: { folder_id: e.target.value || null } })}
                      className="rounded border border-gray-200 px-1.5 py-1 text-xs text-gray-600"
                    >
                      <option value="">بدون مجلد</option>
                      {data.folders.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.name}
                        </option>
                      ))}
                    </select>

                    <span className="text-xs text-gray-400">{b.taskCount} مهمة</span>

                    <button onClick={() => handleDelete(b.id, b.name, b.taskCount)} className="text-gray-300 hover:text-red-500">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </SortableRow>
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}

function MembersTab({ settings }: { settings: ReturnType<typeof useSpaceSettings> }) {
  const { data, addMember, updateMemberAccess, removeMember } = settings;
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [accessLevel, setAccessLevel] = useState<AccessLevel>("edit");

  if (!data) return null;

  if (data.space.space_type === "personal") {
    return <p className="text-sm text-gray-400">المساحات الشخصية لا تقبل أعضاء.</p>;
  }

  const memberUserIds = new Set(data.members.map((m) => m.userId));
  const available = data.employees.filter((e) => !memberUserIds.has(e.id));

  return (
    <div className="max-w-lg space-y-3">
      <div className="flex items-center gap-2">
        <select
          value={selectedEmployee}
          onChange={(e) => setSelectedEmployee(e.target.value)}
          className="flex-1 rounded-md border border-gray-200 px-2 py-1.5 text-sm outline-none"
        >
          <option value="">اختر موظف...</option>
          {available.map((e) => (
            <option key={e.id} value={e.id}>
              {e.name}
            </option>
          ))}
        </select>
        <select
          value={accessLevel}
          onChange={(e) => setAccessLevel(e.target.value as AccessLevel)}
          className="rounded-md border border-gray-200 px-2 py-1.5 text-sm outline-none"
        >
          {(Object.keys(ACCESS_LABELS) as AccessLevel[]).map((a) => (
            <option key={a} value={a}>
              {ACCESS_LABELS[a]}
            </option>
          ))}
        </select>
        <button
          onClick={() => selectedEmployee && addMember({ userId: selectedEmployee, accessLevel }).then(() => setSelectedEmployee(""))}
          disabled={!selectedEmployee}
          className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-white disabled:opacity-40"
        >
          إضافة
        </button>
      </div>

      <div className="divide-y divide-gray-100 rounded-lg border border-gray-100">
        {data.members.length === 0 ? (
          <div className="p-3 text-sm text-gray-400">لا يوجد أعضاء بعد (يمكن للجميع الوصول لأن المساحة عامة، أو لا أحد إن كانت خاصة)</div>
        ) : (
          data.members.map((m) => (
            <div key={m.id} className="flex items-center justify-between px-3 py-2 text-sm">
              <span className="text-gray-700">{m.name}</span>
              <div className="flex items-center gap-2">
                <select
                  value={m.accessLevel}
                  onChange={(e) => updateMemberAccess({ memberId: m.id, accessLevel: e.target.value as AccessLevel })}
                  className="rounded-md border border-gray-200 px-2 py-1 text-xs outline-none"
                >
                  {(Object.keys(ACCESS_LABELS) as AccessLevel[]).map((a) => (
                    <option key={a} value={a}>
                      {ACCESS_LABELS[a]}
                    </option>
                  ))}
                </select>
                <button onClick={() => removeMember(m.id)} className="text-gray-300 hover:text-red-500">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function StatusesTab({ settings }: { settings: ReturnType<typeof useSpaceSettings> }) {
  const { data, createOwnStatusSet, creatingStatusSet, addStatus, updateStatus, deleteStatus } = settings;
  const [newLabel, setNewLabel] = useState("");
  const [newCategory, setNewCategory] = useState<StatusCategory>("not_started");

  if (!data) return null;

  if (!data.statusSetIsSpaceOwned) {
    return (
      <div className="max-w-md space-y-3">
        <p className="text-sm text-gray-500">هذه المساحة تستخدم مجموعة الحالات الافتراضية للشركة حالياً.</p>
        <div className="space-y-1 rounded-lg border border-gray-100 p-2">
          {data.statuses.map((s) => (
            <div key={s.id} className="flex items-center gap-2 px-1 py-1 text-sm text-gray-500">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: s.color ?? "#9CA3AF" }} />
              {s.label_ar} <span className="text-xs text-gray-300">({CATEGORY_LABELS[s.category]})</span>
            </div>
          ))}
        </div>
        <button
          onClick={() => createOwnStatusSet()}
          disabled={creatingStatusSet}
          className="rounded-md border border-gray-200 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-40"
        >
          إنشاء مجموعة حالات خاصة بهذه المساحة
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-lg space-y-3">
      <div className="space-y-1 rounded-lg border border-gray-100">
        {data.statuses.map((s) => (
          <div key={s.id} className="flex items-center gap-2 border-b border-gray-50 px-2 py-1.5 last:border-b-0">
            <input
              type="color"
              defaultValue={s.color ?? "#9CA3AF"}
              onBlur={(e) => updateStatus({ id: s.id, patch: { color: e.target.value } })}
              className="h-6 w-6 shrink-0 rounded border-0"
            />
            <input
              defaultValue={s.label_ar}
              onBlur={(e) => {
                const value = e.target.value.trim();
                if (value && value !== s.label_ar) updateStatus({ id: s.id, patch: { label_ar: value, label: value } });
              }}
              className="flex-1 rounded border border-transparent bg-transparent px-1 py-0.5 text-sm hover:border-gray-200 focus:border-gray-300 focus:outline-none"
            />
            <select
              value={s.category}
              onChange={(e) => updateStatus({ id: s.id, patch: { category: e.target.value as StatusCategory } })}
              className="rounded border border-gray-200 px-1.5 py-1 text-xs"
            >
              {(Object.keys(CATEGORY_LABELS) as StatusCategory[]).map((c) => (
                <option key={c} value={c}>
                  {CATEGORY_LABELS[c]}
                </option>
              ))}
            </select>
            <button onClick={() => deleteStatus(s.id)} className="text-gray-300 hover:text-red-500">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <input
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
          placeholder="اسم الحالة الجديدة"
          className="flex-1 rounded-md border border-gray-200 px-2 py-1.5 text-sm outline-none"
        />
        <select
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value as StatusCategory)}
          className="rounded-md border border-gray-200 px-2 py-1.5 text-sm outline-none"
        >
          {(Object.keys(CATEGORY_LABELS) as StatusCategory[]).map((c) => (
            <option key={c} value={c}>
              {CATEGORY_LABELS[c]}
            </option>
          ))}
        </select>
        <button
          onClick={() => {
            if (!newLabel.trim()) return;
            addStatus({ labelAr: newLabel.trim(), category: newCategory });
            setNewLabel("");
          }}
          className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-white"
        >
          إضافة
        </button>
      </div>
    </div>
  );
}

function FeaturesTab({ settings }: { settings: ReturnType<typeof useSpaceSettings> }) {
  const { data, updateFeatureSettings } = settings;
  if (!data) return null;
  const current: SpaceFeatureSettings = {
    ...DEFAULT_FEATURE_SETTINGS,
    ...(data.space.settings as unknown as Partial<SpaceFeatureSettings>),
  };

  const toggle = (key: keyof Omit<SpaceFeatureSettings, "default_view">) => {
    updateFeatureSettings({ ...current, [key]: !current[key] });
  };

  return (
    <div className="max-w-md space-y-3">
      <label className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2">
        <span className="text-sm text-gray-700">تتبع الوقت</span>
        <input type="checkbox" checked={current.time_tracking} onChange={() => toggle("time_tracking")} className="h-4 w-4" />
      </label>
      <label className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2">
        <span className="text-sm text-gray-700">الأولويات</span>
        <input type="checkbox" checked={current.priorities} onChange={() => toggle("priorities")} className="h-4 w-4" />
      </label>
      <label className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2">
        <span className="text-sm text-gray-700">أنواع المهام</span>
        <input type="checkbox" checked={current.task_types} onChange={() => toggle("task_types")} className="h-4 w-4" />
      </label>
      <label className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2">
        <span className="text-sm text-gray-700">العرض الافتراضي</span>
        <select
          value={current.default_view}
          onChange={(e) => updateFeatureSettings({ ...current, default_view: e.target.value as "list" | "board" })}
          className="rounded-md border border-gray-200 px-2 py-1 text-sm"
        >
          <option value="list">قائمة</option>
          <option value="board">لوحة</option>
        </select>
      </label>
    </div>
  );
}

// Which extra fields to show for a given trigger/action type, and how to
// read/write them into the flat string-keyed config map this form edits
// before it's sent as trigger_config/action_config jsonb.
const TRIGGER_CONFIG_FIELD: Partial<Record<TriggerType, "status" | "field">> = {
  status_changed: "status",
  field_changed: "field",
};
const ACTION_CONFIG_FIELD: Partial<Record<ActionType, "status" | "priority" | "employee" | "text" | "board" | "template">> = {
  set_status: "status",
  set_priority: "priority",
  set_assignee: "employee",
  post_comment: "text",
  move_task: "board",
  create_task: "text",
  send_notification: "text",
  apply_template: "template",
};

function AutomationsTab({ spaceId, statuses }: { spaceId: string; statuses: StatusRow[] }) {
  const { data, createAutomation, toggleActive, deleteAutomation } = useSpaceAutomations(spaceId);
  const [showNew, setShowNew] = useState(false);
  const [name, setName] = useState("");
  const [triggerType, setTriggerType] = useState<TriggerType>("status_changed");
  const [actionType, setActionType] = useState<ActionType>("set_status");
  const [triggerValue, setTriggerValue] = useState("");
  const [actionValue, setActionValue] = useState("");

  if (!data) {
    return (
      <div className="flex items-center justify-center py-10 text-gray-400">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  const triggerConfigKey: Record<string, string> = { status: "to_status_id", field: "field_definition_id" };
  const actionConfigKey: Record<string, string> = {
    status: "status_id",
    priority: "priority",
    employee: "user_id",
    text: "text",
    board: "board_id",
    template: "template_id",
  };

  const handleCreate = async () => {
    if (!name.trim()) return;
    const triggerField = TRIGGER_CONFIG_FIELD[triggerType];
    const actionField = ACTION_CONFIG_FIELD[actionType];
    const triggerConfig: Json = triggerField && triggerValue ? { [triggerConfigKey[triggerField]]: triggerValue } : {};
    const actionConfig: Json = actionField && actionValue ? { [actionConfigKey[actionField]]: actionValue } : {};
    await createAutomation({ name: name.trim(), triggerType, triggerConfig, actionType, actionConfig });
    setShowNew(false);
    setName("");
    setTriggerValue("");
    setActionValue("");
  };

  const renderConfigField = (
    field: "status" | "field" | "priority" | "employee" | "text" | "board" | "template" | undefined,
    value: string,
    onChange: (v: string) => void,
  ) => {
    if (!field) return null;
    if (field === "field") {
      return (
        <select value={value} onChange={(e) => onChange(e.target.value)} className="flex-1 rounded-md border border-gray-200 px-2 py-1.5 text-sm outline-none">
          <option value="">اختر الحقل...</option>
          {data.pickers.fields.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name_ar}
            </option>
          ))}
        </select>
      );
    }
    if (field === "status") {
      return (
        <select value={value} onChange={(e) => onChange(e.target.value)} className="flex-1 rounded-md border border-gray-200 px-2 py-1.5 text-sm outline-none">
          <option value="">اختر الحالة...</option>
          {statuses.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label_ar}
            </option>
          ))}
        </select>
      );
    }
    if (field === "priority") {
      return (
        <select value={value} onChange={(e) => onChange(e.target.value)} className="flex-1 rounded-md border border-gray-200 px-2 py-1.5 text-sm outline-none">
          <option value="">اختر الأولوية...</option>
          {(Object.keys(PRIORITY_LABELS) as Priority[]).map((p) => (
            <option key={p} value={p}>
              {PRIORITY_LABELS[p]}
            </option>
          ))}
        </select>
      );
    }
    if (field === "employee") {
      return (
        <select value={value} onChange={(e) => onChange(e.target.value)} className="flex-1 rounded-md border border-gray-200 px-2 py-1.5 text-sm outline-none">
          <option value="">اختر الموظف...</option>
          {data.pickers.employees.map((e) => (
            <option key={e.id} value={e.id}>
              {e.name}
            </option>
          ))}
        </select>
      );
    }
    if (field === "board") {
      return (
        <select value={value} onChange={(e) => onChange(e.target.value)} className="flex-1 rounded-md border border-gray-200 px-2 py-1.5 text-sm outline-none">
          <option value="">اختر اللوحة...</option>
          {data.pickers.boards.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
      );
    }
    if (field === "template") {
      return (
        <select value={value} onChange={(e) => onChange(e.target.value)} className="flex-1 rounded-md border border-gray-200 px-2 py-1.5 text-sm outline-none">
          <option value="">اختر القالب...</option>
          {data.pickers.templates.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name_ar}
            </option>
          ))}
        </select>
      );
    }
    return (
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="نص"
        className="flex-1 rounded-md border border-gray-200 px-2 py-1.5 text-sm outline-none"
      />
    );
  };

  const describeConfig = (a: Automation) => {
    const t = a.trigger_config as Record<string, string> | null;
    const ac = a.action_config as Record<string, string> | null;
    const triggerDetail =
      t?.to_status_id ? statuses.find((s) => s.id === t.to_status_id)?.label_ar : t?.field_definition_id ? data.pickers.fields.find((f) => f.id === t.field_definition_id)?.name_ar : null;
    const actionDetail = ac?.status_id
      ? statuses.find((s) => s.id === ac.status_id)?.label_ar
      : ac?.priority
        ? PRIORITY_LABELS[ac.priority as Priority]
        : ac?.user_id
          ? data.pickers.employees.find((e) => e.id === ac.user_id)?.name
          : ac?.board_id
            ? data.pickers.boards.find((b) => b.id === ac.board_id)?.name
            : ac?.template_id
              ? data.pickers.templates.find((tpl) => tpl.id === ac.template_id)?.name_ar
              : ac?.text || null;
    return `${TRIGGER_LABELS[a.trigger_type]}${triggerDetail ? ` (${triggerDetail})` : ""} ← ${ACTION_LABELS[a.action_type]}${actionDetail ? ` (${actionDetail})` : ""}`;
  };

  return (
    <div className="max-w-2xl space-y-4">
      <p className="rounded-md bg-amber-50 px-2.5 py-1.5 text-xs text-amber-700">
        لا يوجد محرك تنفيذ بعد — القاعدة تُحفظ بشكل صحيح وتُفعَّل/تُعطَّل، لكن لا شيء في قاعدة البيانات ينفّذها تلقائياً حالياً.
      </p>
      <p className="text-xs text-gray-400">الشروط الإضافية (Conditions) غير مدعومة بعد — كل قاعدة تُنفَّذ عند كل حدث من نوع المُحفِّز المختار.</p>

      <button
        onClick={() => setShowNew((v) => !v)}
        className="flex items-center gap-1.5 rounded-md border border-gray-200 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
      >
        <Plus className="h-3.5 w-3.5" />
        قاعدة جديدة
      </button>

      {showNew && (
        <div className="space-y-2 rounded-lg border border-gray-200 bg-gray-50 p-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="اسم القاعدة"
            className="w-full rounded-md border border-gray-200 px-2 py-1.5 text-sm outline-none"
          />
          <div className="flex items-center gap-2 text-sm">
            <span className="w-10 shrink-0 text-gray-500">عند</span>
            <select
              value={triggerType}
              onChange={(e) => {
                setTriggerType(e.target.value as TriggerType);
                setTriggerValue("");
              }}
              className="flex-1 rounded-md border border-gray-200 px-2 py-1.5 outline-none"
            >
              {(Object.keys(TRIGGER_LABELS) as TriggerType[]).map((t) => (
                <option key={t} value={t}>
                  {TRIGGER_LABELS[t]}
                </option>
              ))}
            </select>
            {renderConfigField(TRIGGER_CONFIG_FIELD[triggerType], triggerValue, setTriggerValue)}
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="w-10 shrink-0 text-gray-500">قم بـ</span>
            <select
              value={actionType}
              onChange={(e) => {
                setActionType(e.target.value as ActionType);
                setActionValue("");
              }}
              className="flex-1 rounded-md border border-gray-200 px-2 py-1.5 outline-none"
            >
              {(Object.keys(ACTION_LABELS) as ActionType[]).map((a) => (
                <option key={a} value={a}>
                  {ACTION_LABELS[a]}
                </option>
              ))}
            </select>
            {renderConfigField(ACTION_CONFIG_FIELD[actionType], actionValue, setActionValue)}
          </div>
          <button onClick={handleCreate} className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-white">
            إنشاء
          </button>
        </div>
      )}

      <div className="divide-y divide-gray-100 rounded-lg border border-gray-100">
        {data.automations.length === 0 ? (
          <div className="p-3 text-sm text-gray-400">لا توجد قواعد أتمتة بعد</div>
        ) : (
          data.automations.map((a) => (
            <div key={a.id} className="flex items-center justify-between px-3 py-2 text-sm">
              <div>
                <div className="font-medium text-gray-800">{a.name}</div>
                <div className="text-xs text-gray-400">{describeConfig(a)}</div>
              </div>
              <div className="flex items-center gap-2">
                <label className="relative inline-flex cursor-pointer items-center">
                  <input
                    type="checkbox"
                    checked={a.is_active}
                    onChange={(e) => toggleActive({ id: a.id, isActive: e.target.checked })}
                    className="peer sr-only"
                  />
                  <div className="h-5 w-9 rounded-full bg-gray-200 peer-checked:bg-primary" />
                  <div className="absolute right-0.5 h-4 w-4 rounded-full bg-white transition-transform peer-checked:-translate-x-4" />
                </label>
                <button onClick={() => deleteAutomation(a.id)} className="text-gray-300 hover:text-red-500">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <div>
        <div className="mb-1 text-xs font-semibold text-gray-500">سجل التشغيل</div>
        <div className="divide-y divide-gray-100 rounded-lg border border-gray-100">
          {data.runs.length === 0 ? (
            <div className="p-3 text-sm text-gray-400">لا يوجد سجل تشغيل بعد</div>
          ) : (
            data.runs.map((run) => (
              <div key={run.id} className="flex items-center justify-between px-3 py-1.5 text-xs">
                <span className={`rounded-full px-2 py-0.5 font-medium ${RUN_STATUS_STYLE[run.status]}`}>
                  {run.status === "success" ? "نجاح" : run.status === "failed" ? "فشل" : "تخطي"}
                </span>
                <span className="flex-1 truncate px-2 text-gray-500">{run.error ?? ""}</span>
                <span className="shrink-0 text-gray-400">{new Date(run.ran_at).toLocaleString("ar-u-nu-latn")}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
