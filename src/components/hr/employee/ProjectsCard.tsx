import { Edit } from "lucide-react";
import { formatDate } from "../../../utils/helpper";
import { useEffect, useState } from "react";

interface Project {
  id: string;
  name: string;
  code?: string;
  role?: string;
  status?: string;
  assigned_at?: string;
}

interface ProjectsCardProps {
  projects: Project[];
  onSave?: (projects: Project[]) => void;
}

const ProjectsCard = ({ projects, onSave }: ProjectsCardProps) => {
  const [editMode, setEditMode] = useState(false);
  const [local, setLocal] = useState<Project[]>(projects ?? []);

  useEffect(() => setLocal(projects ?? []), [projects]);

  const updateProject = (idx: number, key: keyof Project, value: string) => {
    setLocal((s) => {
      const copy = [...s];
      copy[idx] = { ...(copy[idx] ?? {}), [key]: value } as Project;
      return copy;
    });
  };

  const addProject = () => {
    const id = `p_${Date.now()}`;
    setLocal((s) => [
      ...s,
      { id, name: "", assigned_at: new Date().toISOString() },
    ]);
  };

  const removeProject = (idx: number) =>
    setLocal((s) => s.filter((_, i) => i !== idx));

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 border">
      <div className="flex justify-between items-start">
        <h4 className="text-md font-medium text-gray-800">المشاريع الحالية</h4>
        {!editMode ? (
          <button
            className="text-gray-400 hover:text-gray-600"
            onClick={() => setEditMode(true)}
          >
            <Edit className="h-4 w-4" />
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button
              className="px-3 py-1 rounded-md bg-green-600 text-white text-sm"
              onClick={() => {
                onSave?.(local);
                setEditMode(false);
              }}
            >
              حفظ
            </button>
            <button
              className="px-3 py-1 rounded-md bg-gray-100 text-sm"
              onClick={() => {
                setLocal(projects ?? []);
                setEditMode(false);
              }}
            >
              إلغاء
            </button>
          </div>
        )}
      </div>

      <div className="mt-4 space-y-3 text-sm text-gray-700">
        {local.length > 0 ? (
          local.map((p, idx) => (
            <div key={p.id} className="p-4 bg-gray-50 rounded-md">
              {editMode ? (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      className="flex-1 border rounded px-2 py-1 text-sm"
                      value={p.name}
                      onChange={(e) =>
                        updateProject(idx, "name", e.target.value)
                      }
                    />
                    <button
                      className="text-sm text-red-600 px-2 py-1"
                      onClick={() => removeProject(idx)}
                    >
                      حذف
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      className="border rounded px-2 py-1 text-sm"
                      value={p.code ?? ""}
                      onChange={(e) =>
                        updateProject(idx, "code", e.target.value)
                      }
                      placeholder="Code"
                    />
                    <input
                      className="border rounded px-2 py-1 text-sm"
                      value={p.role ?? ""}
                      onChange={(e) =>
                        updateProject(idx, "role", e.target.value)
                      }
                      placeholder="Role"
                    />
                    <input
                      className="border rounded px-2 py-1 text-sm"
                      value={p.status ?? ""}
                      onChange={(e) =>
                        updateProject(idx, "status", e.target.value)
                      }
                      placeholder="Status"
                    />
                    <input
                      className="border rounded px-2 py-1 text-sm"
                      value={p.assigned_at ?? ""}
                      onChange={(e) =>
                        updateProject(idx, "assigned_at", e.target.value)
                      }
                      placeholder="Assigned at"
                    />
                  </div>
                </div>
              ) : (
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-semibold">{p.name}</div>
                    <div className="text-xs text-gray-500">
                      {p.code ? `${p.code} • ` : ""}
                      {p.role ? `${p.role} • ` : ""}
                      {p.status ? `${p.status}` : ""}
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 text-right">
                    تعيين: {formatDate(p.assigned_at ?? "")}
                  </div>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="text-gray-400">لا يوجد مشاريع حالية</div>
        )}

        {editMode && (
          <div className="mt-3">
            <button
              className="px-3 py-1 rounded-md bg-primary text-white text-sm"
              onClick={addProject}
            >
              أضف مشروع
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectsCard;
