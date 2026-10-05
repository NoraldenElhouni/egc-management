import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { BriefcaseBusiness, ChevronRight, Loader2, Search } from "lucide-react";
import { useProjectRoleHolders, type RoleHolderRow } from "../../../hooks/team/useProjectRolesAdmin";
import { formatSlashDate } from "../../../components/tasks/board/taskDates";

// Settings → project roles → one role: everyone who holds it, on which
// project, since when. Grouped by person (who carries this role where) or
// by project (who holds it on each project), with a search over both.

type GroupBy = "person" | "project";

export default function ProjectRoleDetailPage() {
  const { roleId } = useParams<{ roleId: string }>();
  const { data, loading, error } = useProjectRoleHolders(roleId);
  const [search, setSearch] = useState("");
  const [groupBy, setGroupBy] = useState<GroupBy>("person");

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase();
    const all = data?.rows ?? [];
    return term
      ? all.filter(
          (r) =>
            r.personName.toLowerCase().includes(term) ||
            r.projectName.toLowerCase().includes(term) ||
            (r.email ?? "").toLowerCase().includes(term),
        )
      : all;
  }, [data, search]);

  const groups = useMemo(() => {
    const map = new Map<string, { key: string; title: string; subtitle: string | null; items: RoleHolderRow[] }>();
    for (const r of rows) {
      const key = groupBy === "person" ? r.personId : r.projectId;
      const group = map.get(key) ?? {
        key,
        title: groupBy === "person" ? r.personName : r.projectName,
        subtitle: groupBy === "person" ? r.email : null,
        items: [],
      };
      group.items.push(r);
      map.set(key, group);
    }
    return Array.from(map.values()).sort((a, b) => a.title.localeCompare(b.title, "ar"));
  }, [rows, groupBy]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center text-gray-400">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  if (error || !data) {
    return <div className="p-6 text-sm text-red-500">تعذّر تحميل الدور</div>;
  }

  const peopleCount = new Set(data.rows.map((r) => r.personId)).size;
  const projectCount = new Set(data.rows.map((r) => r.projectId)).size;

  return (
    <div className="mx-auto max-w-4xl p-6" dir="rtl">
      <Link to="/settings/project-roles" className="mb-3 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
        <ChevronRight className="h-4 w-4" />
        أدوار المشاريع
      </Link>

      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <BriefcaseBusiness className="h-5 w-5 text-primary" />
            <h1 className="text-lg font-semibold text-gray-900">{data.roleName}</h1>
          </div>
          <p className="mt-1 text-sm text-gray-500">
            {peopleCount} شخص في {projectCount} مشروع
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-md border border-gray-200 px-2 py-1.5">
            <Search className="h-4 w-4 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="بحث بالاسم أو المشروع..."
              className="w-52 bg-transparent text-sm outline-none"
            />
          </div>
          <div className="flex overflow-hidden rounded-md border border-gray-200 text-sm">
            {(["person", "project"] as GroupBy[]).map((g) => (
              <button
                key={g}
                onClick={() => setGroupBy(g)}
                className={`px-3 py-1.5 ${groupBy === g ? "bg-primary text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}
              >
                {g === "person" ? "حسب الشخص" : "حسب المشروع"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {data.rows.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-200 p-8 text-center text-sm text-gray-400">
          لا أحد يشغل هذا الدور في أي مشروع
        </div>
      ) : groups.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-200 p-8 text-center text-sm text-gray-400">لا نتائج</div>
      ) : (
        <div className="space-y-3">
          {groups.map((group) => (
            <div key={group.key} className="overflow-hidden rounded-lg border border-gray-200">
              <div className="flex items-baseline justify-between gap-2 border-b border-gray-100 bg-gray-50 px-4 py-2">
                {groupBy === "project" ? (
                  <Link
                    to={`/execution-management/projects/${group.key}`}
                    className="text-sm font-semibold text-primary hover:underline"
                    title="فتح فريق المشروع"
                  >
                    {group.title}
                  </Link>
                ) : (
                  <span className="text-sm font-semibold text-gray-800">
                    {group.title}
                    {group.subtitle && <span className="mr-2 text-xs font-normal text-gray-400">{group.subtitle}</span>}
                  </span>
                )}
                <span className="text-xs text-gray-400">
                  {group.items.length} {groupBy === "person" ? "مشروع" : "شخص"}
                </span>
              </div>
              <table className="w-full text-sm">
                <tbody>
                  {group.items
                    .slice()
                    .sort((a, b) =>
                      (groupBy === "person" ? a.projectName : a.personName).localeCompare(
                        groupBy === "person" ? b.projectName : b.personName,
                        "ar",
                      ),
                    )
                    .map((r) => (
                      <tr key={r.assignmentId} className="border-b border-gray-50 last:border-0">
                        <td className="px-4 py-2">
                          {groupBy === "person" ? (
                            <Link
                              to={`/execution-management/projects/${r.projectId}`}
                              className="text-gray-800 hover:text-primary hover:underline"
                            >
                              {r.projectName}
                            </Link>
                          ) : (
                            <span className="text-gray-800">
                              {r.personName}
                              {r.email && <span className="mr-2 text-xs text-gray-400">{r.email}</span>}
                            </span>
                          )}
                        </td>
                        <td className="w-40 px-4 py-2 text-left text-xs text-gray-400">
                          منذ {formatSlashDate(r.assignedAt)}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
