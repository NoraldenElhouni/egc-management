import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { Info, Users } from "lucide-react";
import { useAuth } from "../../../hooks/useAuth";
import { usePermissionCatalog } from "../../../hooks/permissions/usePermissionCatalog";
import { useProjectTeam } from "../../../hooks/team/useTeamAssignments";
import {
  useProjectDefaults,
  useSaveProjectDefaults,
} from "../../../hooks/permissions/useProjectGrants";
import ProjectDefaultsSection from "../../../components/permissions/ProjectDefaultsSection";
import TeamMemberOverridesSection from "../../../components/permissions/TeamMemberOverridesSection";
import type { GrantDiff } from "../../../components/permissions/permissionModel";
import LoadingPage from "../../../components/ui/LoadingPage";
import ErrorPage from "../../../components/ui/errorPage";
import BackButton from "../../../components/ui/BackButton";

// =====================================================================
// Project → Permissions — implementation guide section 4.6. Phase 6.
// =====================================================================
// The last two of the five layers become configurable here. After this
// page exists, the whole model is expressible through the UI.
//
// Moved here from /projects/team/:projectId/permissions along with the
// team screen — permissions belong next to the team they apply to.
//
// The OLD per-employee screen (TeamPermissions, on the dead
// project_user_permissions table) that used to sit beside this one has
// been deleted, not moved. See issues/02. This page is now the only
// project permissions screen.
//
// RLS is untouched and stays exactly as permissive as it is today.
//
// ONLY PROJECT-SCOPED PERMISSIONS ARE OFFERED. This is not a UI
// simplification, it is a correctness requirement: the resolver ignores
// layers 1 and 2 entirely for company-wide permissions
// (phase2-resolver.sql, DECISION 6), because "can view bookkeeping, but
// only on project 42" is not a coherent thing to say. The foreign key
// would happily accept such a row; the resolver would never honour it.
// Offering it would be a data-entry trap.
// =====================================================================

export default function ProjectPermissionsPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { user } = useAuth();

  const { data: catalog, isLoading: catalogLoading } = usePermissionCatalog();
  const { data: team, isLoading: teamLoading } = useProjectTeam(projectId);
  const { data: defaults, isLoading: defaultsLoading } =
    useProjectDefaults(projectId);
  const saveDefaults = useSaveProjectDefaults();

  const projectScoped = useMemo(
    () => (catalog ?? []).filter((p) => p.is_project_scoped),
    [catalog],
  );

  const distinctPeople = useMemo(
    () => new Set((team ?? []).map((m) => m.personId)).size,
    [team],
  );

  if (!projectId) {
    return (
      <div className="p-4">
        <ErrorPage
          error="رقم المشروع غير موجود في الرابط"
          label="خطأ في المعلومات"
        />
      </div>
    );
  }

  if (catalogLoading || teamLoading || defaultsLoading) {
    return <LoadingPage label="جاري تحميل الصلاحيات..." />;
  }

  const handleSaveDefaults = async (diff: GrantDiff) => {
    await saveDefaults.mutateAsync({
      projectId,
      diff,
      grantedBy: user?.id ?? null,
    });
  };

  return (
    <div className="p-4 space-y-4 max-w-5xl mx-auto">
      <BackButton />

      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">
          صلاحيات المشروع
        </h1>
        <p className="text-gray-600 text-sm">
          قاعدة عامة لكل من يعمل على المشروع، واستثناءات لأشخاص بعينهم.
        </p>
      </div>

      <div className="flex items-start gap-2 border border-blue-200 bg-blue-50 rounded-lg px-4 py-3 text-sm text-blue-900">
        <Info size={15} className="mt-0.5 shrink-0" />
        <div>
          <p>
            تُعرض هنا صلاحيات المشاريع فقط. الصلاحيات العامة (مثل عرض المحاسبة)
            لا تُضبط لكل مشروع على حدة — مكانها الدور أو القسم أو استثناء الشخص.
          </p>
          {/* This line used to read "this screen only records settings —
              nothing in the app relies on it yet." That was true in
              Phase 6 and false since Phase 7 wired the resolver into
              real route and menu access. Left uncorrected it told people
              the working screen did nothing, which is part of why the
              old (actually dead) screen kept being used instead. */}
          <p className="text-xs mt-1 text-blue-800">
            ما يُحفظ هنا يسري فعليًا على وصول المستخدمين لهذا المشروع.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 bg-white border border-gray-200 rounded-lg px-4 py-2.5">
        <span className="flex items-center gap-2 text-sm text-gray-600">
          <Users size={15} className="text-gray-400" />
          {distinctPeople} شخص في الفريق
        </span>
        <Link
          to={`/execution-management/projects/${projectId}`}
          className="text-xs text-blue-600 hover:text-blue-800 font-medium"
        >
          إدارة أعضاء الفريق ←
        </Link>
      </div>

      <ProjectDefaultsSection
        catalog={projectScoped}
        savedGrants={defaults ?? []}
        teamSize={distinctPeople}
        onSave={handleSaveDefaults}
        saving={saveDefaults.isPending}
      />

      <TeamMemberOverridesSection
        projectId={projectId}
        catalog={projectScoped}
        team={team ?? []}
      />
    </div>
  );
}
