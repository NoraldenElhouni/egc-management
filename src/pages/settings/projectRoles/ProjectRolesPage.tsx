import { useState } from "react";
import { Link } from "react-router-dom";
import { BriefcaseBusiness, ChevronDown, ChevronLeft, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { useProjectRolesAdmin, type ProjectRoleAdminRow } from "../../../hooks/team/useProjectRolesAdmin";

// Settings → project roles. The positions people hold on project teams
// (Project Manager, Site Engineer, ...) — the same list the project team
// screens and template tasks' role assignments pick from. The chevron
// previews who holds a role where; the name opens the role's own page
// (ProjectRoleDetailPage). A role can be deleted only while nothing uses
// it (see useProjectRolesAdmin.ts).

function errorText(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (err && typeof err === "object" && "message" in err) return String((err as { message: unknown }).message);
  return "حدث خطأ";
}

export default function ProjectRolesPage() {
  const { roles, loading, error, createRole, creating, renameRole, deleteRole } = useProjectRolesAdmin();
  const [newName, setNewName] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);

  const run = async (fn: () => Promise<void>) => {
    setActionError(null);
    try {
      await fn();
    } catch (err) {
      setActionError(errorText(err));
    }
  };

  const handleCreate = () =>
    run(async () => {
      if (!newName.trim()) return;
      await createRole(newName.trim());
      setNewName("");
    });

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center text-gray-400">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  if (error) {
    return <div className="p-6 text-sm text-red-500">تعذّر تحميل أدوار المشاريع</div>;
  }

  return (
    <div className="mx-auto max-w-3xl p-6" dir="rtl">
      <div className="mb-1 flex items-center gap-2">
        <BriefcaseBusiness className="h-5 w-5 text-primary" />
        <h1 className="text-lg font-semibold text-gray-900">أدوار المشاريع</h1>
      </div>
      <p className="mb-5 text-sm text-gray-500">
        المناصب التي يشغلها الأشخاص في فرق المشاريع، وتُستخدم أيضاً لتكليف مهام القوالب حسب الدور.
      </p>

      <div className="mb-4 flex items-center gap-2">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleCreate()}
          placeholder="اسم دور جديد"
          className="flex-1 rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-primary"
        />
        <button
          onClick={handleCreate}
          disabled={creating || !newName.trim()}
          className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-medium text-white disabled:opacity-40"
        >
          <Plus className="h-4 w-4" />
          إضافة
        </button>
      </div>

      {actionError && <div className="mb-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{actionError}</div>}

      {roles.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-200 p-8 text-center text-sm text-gray-400">
          لا توجد أدوار بعد
        </div>
      ) : (
        <div className="divide-y divide-gray-100 rounded-lg border border-gray-200">
          {roles.map((role) => (
            <RoleRow
              key={role.id}
              role={role}
              onRename={(name) => run(() => renameRole({ id: role.id, name }))}
              onDelete={() =>
                run(async () => {
                  if (confirm(`حذف الدور "${role.name}"؟`)) await deleteRole(role.id);
                })
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}

function RoleRow({
  role,
  onRename,
  onDelete,
}: {
  role: ProjectRoleAdminRow;
  onRename: (name: string) => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(role.name);

  const peopleCount = new Set(role.projects.flatMap((p) => p.people.map((x) => x.id))).size;
  const inUse = role.assignmentCount > 0 || role.templateTaskCount > 0;
  const deleteBlockedReason =
    role.assignmentCount > 0
      ? "مستخدم في فرق المشاريع"
      : role.templateTaskCount > 0
        ? "مستخدم في مهام القوالب"
        : null;

  const commitRename = () => {
    setEditing(false);
    if (draft.trim() && draft.trim() !== role.name) onRename(draft.trim());
    else setDraft(role.name);
  };

  return (
    <div>
      <div className="group flex items-center gap-3 px-4 py-3">
        <button onClick={() => setOpen((v) => !v)} className="text-gray-400 hover:text-gray-600" title="عرض من يشغل الدور">
          {open ? <ChevronDown className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>

        {editing ? (
          <input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commitRename}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitRename();
              if (e.key === "Escape") {
                setDraft(role.name);
                setEditing(false);
              }
            }}
            className="flex-1 rounded-md border border-gray-200 px-2 py-1 text-sm outline-none focus:border-primary"
          />
        ) : (
          <Link
            to={`/settings/project-roles/${role.id}`}
            className="flex-1 text-right text-sm font-medium text-gray-800 hover:text-primary hover:underline"
            title="عرض كل من يشغل هذا الدور"
          >
            {role.name}
          </Link>
        )}

        <span className="shrink-0 text-xs text-gray-400">
          {role.projects.length} مشروع · {peopleCount} شخص
          {role.templateTaskCount > 0 && ` · ${role.templateTaskCount} مهمة قالب`}
        </span>

        <div className="flex shrink-0 items-center gap-2 opacity-0 group-hover:opacity-100">
          <button
            onClick={() => {
              setDraft(role.name);
              setEditing(true);
            }}
            className="text-gray-400 hover:text-gray-600"
            title="إعادة تسمية"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={onDelete}
            disabled={inUse}
            className="text-gray-400 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:text-gray-400"
            title={deleteBlockedReason ? `لا يمكن الحذف: ${deleteBlockedReason}` : "حذف"}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-gray-50 bg-gray-50/60 px-4 py-3">
          {role.projects.length === 0 ? (
            <div className="text-xs text-gray-400">لا أحد يشغل هذا الدور في أي مشروع</div>
          ) : (
            <>
            <div className="space-y-2">
              {role.projects.map((p) => (
                <div key={p.projectId} className="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-sm">
                  <Link
                    to={`/execution-management/projects/${p.projectId}`}
                    className="font-medium text-primary hover:underline"
                    title="فتح فريق المشروع"
                  >
                    {p.projectName}
                  </Link>
                  <span className="text-gray-600">{p.people.map((x) => x.name).join("، ")}</span>
                </div>
              ))}
            </div>
            <Link to={`/settings/project-roles/${role.id}`} className="mt-2 inline-block text-xs text-primary hover:underline">
              عرض الصفحة الكاملة ←
            </Link>
            </>
          )}
        </div>
      )}
    </div>
  );
}
