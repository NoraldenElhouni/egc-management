import { useState } from "react";
import { useParams } from "react-router-dom";
import { Loader2, Plus, Trash2, X } from "lucide-react";
import {
  useSpaceSettings,
  DEFAULT_FEATURE_SETTINGS,
  type SpaceFeatureSettings,
} from "../../../hooks/tasks/useSpaceSettings";
import {
  useSpaceAutomations,
  type TriggerType,
  type ActionType,
} from "../../../hooks/tasks/useSpaceAutomations";
import type { Database } from "../../../lib/supabase";

// D9 — Space settings + D10 — Automations (build plan Part 7). See
// useSpaceSettings.ts and useSpaceAutomations.ts headers for scoping
// decisions (status-set ownership, space-only automation scope, no
// condition builder yet).

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

const RUN_STATUS_STYLE: Record<Database["tasks"]["Enums"]["automation_run_status"], string> = {
  success: "bg-green-50 text-green-600",
  failed: "bg-red-50 text-red-600",
  skipped: "bg-gray-100 text-gray-500",
};

type Tab = "general" | "members" | "statuses" | "features" | "automations";

const TABS: { key: Tab; label: string }[] = [
  { key: "general", label: "عام" },
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
        {tab === "members" && <MembersTab settings={settings} />}
        {tab === "statuses" && <StatusesTab settings={settings} />}
        {tab === "features" && <FeaturesTab settings={settings} />}
        {tab === "automations" && spaceId && <AutomationsTab spaceId={spaceId} />}
      </div>
    </div>
  );
}

function GeneralTab({ settings }: { settings: ReturnType<typeof useSpaceSettings> }) {
  const { data, updateSpace } = settings;
  if (!data) return null;
  const isPersonal = data.space.space_type === "personal";

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

function AutomationsTab({ spaceId }: { spaceId: string }) {
  const { data, createAutomation, toggleActive, deleteAutomation } = useSpaceAutomations(spaceId);
  const [showNew, setShowNew] = useState(false);
  const [name, setName] = useState("");
  const [triggerType, setTriggerType] = useState<TriggerType>("status_changed");
  const [actionType, setActionType] = useState<ActionType>("set_status");

  if (!data) {
    return (
      <div className="flex items-center justify-center py-10 text-gray-400">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  const handleCreate = async () => {
    if (!name.trim()) return;
    await createAutomation({ name: name.trim(), triggerType, triggerConfig: {}, actionType, actionConfig: {} });
    setShowNew(false);
    setName("");
  };

  return (
    <div className="max-w-2xl space-y-4">
      <p className="text-xs text-gray-400">
        الشروط الإضافية (Conditions) غير مدعومة بعد — كل قاعدة تُنفَّذ عند كل حدث من نوع المُحفِّز المختار.
      </p>

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
            <span className="text-gray-500">عند</span>
            <select
              value={triggerType}
              onChange={(e) => setTriggerType(e.target.value as TriggerType)}
              className="flex-1 rounded-md border border-gray-200 px-2 py-1.5 outline-none"
            >
              {(Object.keys(TRIGGER_LABELS) as TriggerType[]).map((t) => (
                <option key={t} value={t}>
                  {TRIGGER_LABELS[t]}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-500">قم بـ</span>
            <select
              value={actionType}
              onChange={(e) => setActionType(e.target.value as ActionType)}
              className="flex-1 rounded-md border border-gray-200 px-2 py-1.5 outline-none"
            >
              {(Object.keys(ACTION_LABELS) as ActionType[]).map((a) => (
                <option key={a} value={a}>
                  {ACTION_LABELS[a]}
                </option>
              ))}
            </select>
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
                <div className="text-xs text-gray-400">
                  {TRIGGER_LABELS[a.trigger_type]} ← {ACTION_LABELS[a.action_type]}
                </div>
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
