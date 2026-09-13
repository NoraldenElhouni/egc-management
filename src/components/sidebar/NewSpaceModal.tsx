import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { X, Search, Check } from "lucide-react";
import {
  useCreateTaskEntities,
  useProjectOptions,
  useDepartmentOptions,
} from "../../hooks/tasks/useCreateTaskEntities";
import { useClickOutside } from "../../hooks/tasks/useClickOutside";
import type { Database } from "../../lib/supabase";

type SpaceType = Database["tasks"]["Enums"]["space_type"];

const SPACE_TYPE_LABELS: Record<SpaceType, string> = {
  project: "مشروع",
  department: "قسم",
  company: "شركة",
  personal: "شخصية",
};

interface ProjectOption {
  id: string;
  name: string;
  serial_number: number | null;
}

function ProjectPicker({
  projects,
  projectId,
  onChange,
}: {
  projects: ProjectOption[];
  projectId: string;
  onChange: (project: ProjectOption) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, () => setOpen(false));

  const selected = projects.find((p) => p.id === projectId);
  const filtered = projects.filter((p) => {
    if (!search.trim()) return true;
    return p.name.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 rounded-md border border-gray-200 px-2 py-1.5 text-right text-sm outline-none"
      >
        <Search className="h-3.5 w-3.5 shrink-0 text-gray-400" />
        <span className={`flex-1 truncate ${selected ? "text-gray-800" : "text-gray-400"}`}>
          {selected ? selected.name : "اختر المشروع..."}
        </span>
      </button>

      {open && (
        <div className="absolute right-0 left-0 top-full z-30 mt-1 rounded-lg border border-gray-200 bg-white shadow-lg">
          <div className="border-b border-gray-100 p-2">
            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ابحث عن مشروع..."
              className="w-full rounded-md border border-gray-200 px-2 py-1 text-sm outline-none"
            />
          </div>
          <div className="max-h-56 overflow-y-auto py-1">
            {filtered.length === 0 && <div className="px-3 py-2 text-sm text-gray-400">لا نتائج</div>}
            {filtered.map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  onChange(p);
                  setOpen(false);
                  setSearch("");
                }}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-right text-sm hover:bg-gray-50"
              >
                {p.id === projectId ? (
                  <Check className="h-3.5 w-3.5 shrink-0 text-primary" />
                ) : (
                  <span className="w-3.5 shrink-0" />
                )}
                <span className="flex-1 truncate">{p.name}</span>
                <span className="shrink-0 text-xs text-gray-400">{p.serial_number ?? ""}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function NewSpaceModal({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  const { createSpace, creatingSpace } = useCreateTaskEntities();
  const projects = useProjectOptions();
  const departments = useDepartmentOptions();

  const [name, setName] = useState("");
  const [spaceType, setSpaceType] = useState<SpaceType>("project");
  const [projectId, setProjectId] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const canSubmit =
    name.trim().length > 0 &&
    (spaceType !== "project" || !!projectId) &&
    (spaceType !== "department" || !!departmentId);

  const handleSubmit = async () => {
    setError(null);
    try {
      const id = await createSpace({
        name: name.trim(),
        spaceType,
        projectId: spaceType === "project" ? projectId : null,
        departmentId: spaceType === "department" ? departmentId : null,
        visibility: isPublic ? "public" : "private",
      });
      onClose();
      navigate(`/tasks/space/${id}/settings`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذّر إنشاء المساحة");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" dir="rtl">
      <div className="w-full max-w-sm rounded-xl bg-white p-4 shadow-2xl">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900">مساحة جديدة</h2>
          <button onClick={onClose} className="rounded-full p-1 text-gray-400 hover:bg-gray-100">
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        <div className="space-y-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="اسم المساحة"
            className="w-full rounded-md border border-gray-200 px-2 py-1.5 text-sm outline-none"
          />

          <div className="grid grid-cols-4 gap-1">
            {(Object.keys(SPACE_TYPE_LABELS) as SpaceType[]).map((t) => (
              <button
                key={t}
                onClick={() => setSpaceType(t)}
                className={`rounded-md border px-2 py-1.5 text-xs ${
                  spaceType === t ? "border-primary bg-primary-superLight text-primary" : "border-gray-200 text-gray-600"
                }`}
              >
                {SPACE_TYPE_LABELS[t]}
              </button>
            ))}
          </div>

          {spaceType === "project" && (
            <ProjectPicker
              projects={projects}
              projectId={projectId}
              onChange={(project) => {
                setProjectId(project.id);
                setName(project.name);
              }}
            />
          )}

          {spaceType === "department" && (
            <select
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
              className="w-full rounded-md border border-gray-200 px-2 py-1.5 text-sm outline-none"
            >
              <option value="">اختر القسم...</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name_ar ?? d.name}
                </option>
              ))}
            </select>
          )}

          {spaceType === "personal" ? (
            <p className="text-xs text-gray-400">المساحات الشخصية تبقى خاصة دائماً ولا تقبل أعضاء.</p>
          ) : (
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} className="h-3.5 w-3.5" />
              مساحة عامة (يراها الجميع)
            </label>
          )}

          {error && <div className="rounded-md bg-red-50 px-2.5 py-1.5 text-xs text-red-600">{error}</div>}

          <button
            onClick={handleSubmit}
            disabled={!canSubmit || creatingSpace}
            className="w-full rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-white disabled:opacity-40"
          >
            إنشاء
          </button>
        </div>
      </div>
    </div>
  );
}
