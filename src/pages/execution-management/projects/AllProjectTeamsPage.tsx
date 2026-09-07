import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ChevronUp,
  ExternalLink,
  Pencil,
  Search,
  UserRound,
  Users,
  X,
} from "lucide-react";
import { useAllProjectTeams } from "../../../hooks/team/useAllProjectTeams";
import type { ProjectWithTeam } from "../../../hooks/team/useAllProjectTeams";
import { useProjectRoles } from "../../../hooks/team/useTeamAssignments";
import { useCan } from "../../../hooks/permissions/useCan";
import AddTeamMemberForm from "../../../components/project/team/AddTeamMemberForm";
import TeamRoster from "../../../components/project/team/TeamRoster";
import LoadingPage from "../../../components/ui/LoadingPage";
import ErrorPage from "../../../components/ui/errorPage";
import Button from "../../../components/ui/Button";

// =====================================================================
// EVERY PROJECT TEAM ON ONE PAGE — /execution-management/projects/teams
// =====================================================================
// Answers the questions the per-project screen cannot: where is this
// person assigned, which projects have nobody on them, who are all the
// site engineers. Editing happens here too, in place, without opening
// the project.
//
// TWO DIFFERENT PERMISSIONS, AND THEY ARE NOT THE SAME SHAPE
//
//   Opening this page   view_all_project_teams   company-wide
//   Editing one project manage_project_team      PROJECT-SCOPED
//
// That difference is the whole reason this page is built the way it is.
// view_project_team and manage_project_team are both
// is_project_scoped = true, and the resolver force-denies a
// project-scoped permission asked without a project
// (phase2-resolver.sql, DECISION 3) — so neither can gate a page that
// is about all projects at once. Hence view_all_project_teams, which is
// company-wide and means exactly "may see the cross-project list".
//
// WHY EDIT PERMISSION IS RESOLVED LAZILY, PER CARD
// manage_project_team must be asked per project, because a grant can
// carry scope = team_projects_only, in which case the answer genuinely
// differs project by project. Asking for all 63 up front would be 63
// resolver calls on page load. So each card resolves its own answer the
// first time you press "تعديل" on it, and caches it from there.
// Today every grant is all_projects for Admin and Manager, so the
// answer will always be yes — but the page does not assume that,
// because the day someone gets a team-projects-only grant it would
// silently start showing them edit controls they cannot use.
// =====================================================================

type Staffing = "all" | "staffed" | "unstaffed";

export default function AllProjectTeamsPage() {
  const { data: projects, isLoading, error } = useAllProjectTeams();
  const { data: roles } = useProjectRoles();

  const [search, setSearch] = useState("");
  const [roleId, setRoleId] = useState("");
  const [staffing, setStaffing] = useState<Staffing>("all");

  // FILTER RULE, stated once so the behaviour is predictable:
  // search and role filter MEMBERS. A project survives if it still has
  // a matching member, or if the project's own name or number matched —
  // that second half is what lets you search a project and still see
  // its whole team rather than an empty card.
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    return (projects ?? [])
      .filter((project) => {
        if (staffing === "staffed") return project.members.length > 0;
        if (staffing === "unstaffed") return project.members.length === 0;
        return true;
      })
      .map((project) => {
        const projectMatches =
          q === "" ||
          project.projectName.toLowerCase().includes(q) ||
          String(project.serialNumber ?? "").includes(q);

        const members = project.members.filter((member) => {
          if (roleId && member.projectRoleId !== roleId) return false;
          if (q === "" || projectMatches) return true;
          return (
            member.fullName.toLowerCase().includes(q) ||
            (member.email ?? "").toLowerCase().includes(q)
          );
        });

        return { project, members, projectMatches };
      })
      .filter(({ project, members, projectMatches }) => {
        // An unstaffed project has no members to match, so it can only
        // survive on its own name — otherwise searching a person would
        // list every empty project as a false positive.
        if (project.members.length === 0) return projectMatches && !roleId;
        return members.length > 0;
      });
  }, [projects, search, roleId, staffing]);

  const stats = useMemo(() => {
    const all = projects ?? [];
    const assignments = all.reduce((sum, p) => sum + p.members.length, 0);
    const people = new Set(
      all.flatMap((p) => p.members.map((m) => m.personId)),
    ).size;
    return {
      projects: all.length,
      assignments,
      people,
      unstaffed: all.filter((p) => p.members.length === 0).length,
    };
  }, [projects]);

  if (isLoading) return <LoadingPage label="تحميل فرق المشاريع..." />;

  if (error) {
    return (
      <div className="p-4">
        <ErrorPage
          error={error instanceof Error ? error.message : "خطأ غير معروف"}
          label="خطأ في تحميل فرق المشاريع"
        />
      </div>
    );
  }

  const filtersActive = search.trim() !== "" || roleId !== "" || staffing !== "all";

  return (
    <div className="p-4 space-y-4 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">
          فرق كل المشاريع
        </h1>
        <p className="text-gray-600 text-sm">
          كل المشاريع وأعضاء فرقها في صفحة واحدة، مع إمكانية التعديل مباشرة دون
          الدخول إلى كل مشروع على حدة.
        </p>
      </div>

      {/* ── Summary ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="مشروع" value={stats.projects} />
        <StatCard label="تعيين في فريق" value={stats.assignments} />
        <StatCard label="شخص مختلف" value={stats.people} />
        <StatCard
          label="مشروع بلا فريق"
          value={stats.unstaffed}
          tone={stats.unstaffed > 0 ? "warn" : "plain"}
        />
      </div>

      {/* ── Filters ──────────────────────────────────────────────────── */}
      <div className="bg-white border border-gray-200 rounded-xl p-3 grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="relative">
          <Search
            size={15}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث باسم المشروع أو رقمه أو باسم الشخص أو بريده"
            className="w-full border rounded px-3 py-2 pr-9 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <select
          value={roleId}
          onChange={(e) => setRoleId(e.target.value)}
          className="border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">كل الأدوار في المشاريع</option>
          {(roles ?? []).map((role) => (
            <option key={role.id} value={role.id}>
              {role.name}
            </option>
          ))}
        </select>

        <select
          value={staffing}
          onChange={(e) => setStaffing(e.target.value as Staffing)}
          className="border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="all">كل المشاريع</option>
          <option value="staffed">التي لديها فريق فقط</option>
          <option value="unstaffed">التي بلا فريق فقط</option>
        </select>
      </div>

      {filtersActive && (
        <div className="flex items-center justify-between text-xs text-gray-600 px-1">
          <span>
            {filtered.length} من {stats.projects} مشروع
          </span>
          <button
            onClick={() => {
              setSearch("");
              setRoleId("");
              setStaffing("all");
            }}
            className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800"
          >
            <X size={12} />
            مسح عوامل التصفية
          </button>
        </div>
      )}

      {/* ── The list ─────────────────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-gray-300 p-10 text-center">
          <p className="text-sm font-medium text-gray-700">
            لا توجد نتائج مطابقة
          </p>
          <p className="text-xs text-gray-500 mt-1">
            جرّب اسماً آخر أو امسح عوامل التصفية.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(({ project, members }) => (
            <ProjectTeamCard
              key={project.projectId}
              project={project}
              visibleMembers={members}
              membersAreFiltered={members.length !== project.members.length}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------

function StatCard({
  label,
  value,
  tone = "plain",
}: {
  label: string;
  value: number;
  tone?: "plain" | "warn";
}) {
  return (
    <div
      className={`rounded-xl border px-4 py-3 ${
        tone === "warn"
          ? "border-amber-200 bg-amber-50"
          : "border-gray-200 bg-white"
      }`}
    >
      <div
        className={`text-xl font-bold ${
          tone === "warn" ? "text-amber-800" : "text-gray-900"
        }`}
      >
        {value}
      </div>
      <div
        className={`text-xs mt-0.5 ${
          tone === "warn" ? "text-amber-700" : "text-gray-500"
        }`}
      >
        {label}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------

interface CardProps {
  project: ProjectWithTeam;
  visibleMembers: ProjectWithTeam["members"];
  membersAreFiltered: boolean;
}

function ProjectTeamCard({
  project,
  visibleMembers,
  membersAreFiltered,
}: CardProps) {
  const [editing, setEditing] = useState(false);

  // The lazy per-project resolve described at the top of this file.
  // While `editing` is false this asks the company-wide question, which
  // for a project-scoped permission always denies and — importantly —
  // costs no extra request, because the company-wide answer is already
  // cached for the whole app.
  const { can, loading } = useCan(
    "manage_project_team",
    editing ? project.projectId : undefined,
  );

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div className="px-4 py-3 flex items-center justify-between gap-3 border-b border-gray-100">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-900 truncate">
              {project.projectName}
            </span>
            {project.serialNumber !== null && (
              <span className="text-[11px] text-gray-400" dir="ltr">
                #{project.serialNumber}
              </span>
            )}
          </div>
          <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-1.5">
            <Users size={12} className="text-gray-400" />
            {project.members.length === 0
              ? "لا يوجد أعضاء"
              : `${project.members.length} تعيين`}
            {membersAreFiltered && (
              <span className="text-blue-600">
                ({visibleMembers.length} مطابق للبحث)
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <Button
            variant="ghost"
            size="xs"
            onClick={() => setEditing((v) => !v)}
          >
            {editing ? (
              <>
                <ChevronUp size={13} className="ml-1" />
                إغلاق
              </>
            ) : (
              <>
                <Pencil size={13} className="ml-1" />
                تعديل
              </>
            )}
          </Button>
          {/* The project's own team screen, for anything this card does
              not do — its permissions page in particular. */}
          <Link
            to={`/execution-management/projects/${project.projectId}`}
            className="p-1.5 text-gray-400 hover:text-blue-600 rounded"
            title="فتح شاشة فريق هذا المشروع"
          >
            <ExternalLink size={14} />
          </Link>
        </div>
      </div>

      {/* ── Read view ────────────────────────────────────────────────── */}
      {!editing && (
        <div className="px-4 py-3">
          {visibleMembers.length === 0 ? (
            <p className="text-xs text-gray-500">
              لا يوجد أعضاء في فريق هذا المشروع.
            </p>
          ) : (
            <ul className="flex flex-wrap gap-2">
              {visibleMembers.map((member) => (
                <li
                  key={member.assignmentId}
                  className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5"
                >
                  <UserRound size={13} className="text-gray-400 shrink-0" />
                  <span className="text-xs text-gray-900">
                    {member.fullName}
                  </span>
                  <span className="text-[10px] text-gray-500 bg-white border border-gray-200 rounded px-1.5 py-0.5">
                    {member.projectRoleName}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* ── Edit view ────────────────────────────────────────────────── */}
      {editing && (
        <div className="px-4 py-4 bg-gray-50 space-y-4">
          {loading && (
            <p className="text-xs text-gray-500">جاري التحقق من الصلاحية...</p>
          )}

          {!loading && !can && (
            <div className="border border-amber-200 bg-amber-50 text-amber-800 rounded-lg px-3 py-2 text-xs">
              لا تملك صلاحية تعديل فريق هذا المشروع.
            </div>
          )}

          {!loading && can && (
            <>
              {/* The same two components the project's own team screen
                  uses — not a second implementation of add/remove. They
                  write team_assignments and invalidate both this page
                  and that one. */}
              <AddTeamMemberForm
                projectId={project.projectId}
                members={project.members}
              />
              <TeamRoster
                projectId={project.projectId}
                members={project.members}
              />
            </>
          )}
        </div>
      )}
    </div>
  );
}
