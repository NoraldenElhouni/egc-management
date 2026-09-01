import { useState } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../../../hooks/useAuth";
import {
  useDepartment,
  useDepartmentMembers,
} from "../../../hooks/permissions/useDepartments";
import { usePermissionCatalog } from "../../../hooks/permissions/usePermissionCatalog";
import { useGrants, useSaveGrants } from "../../../hooks/permissions/useGrants";
import PermissionEditor from "../../../components/permissions/PermissionEditor";
import DepartmentMembersTab from "../../../components/permissions/DepartmentMembersTab";
import BackButton from "../../../components/ui/BackButton";
import LoadingPage from "../../../components/ui/LoadingPage";
import ErrorPage from "../../../components/ui/errorPage";

// =====================================================================
// Screen 1, detail view — implementation guide section 4.1 steps 4-8.
// Two tabs: Members and Permissions.
// =====================================================================

export default function DepartmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const departmentId = id ?? "";
  const { user } = useAuth();

  const [tab, setTab] = useState<"members" | "permissions">("members");

  const { data: department, isLoading, error } = useDepartment(departmentId);
  const { data: members } = useDepartmentMembers(departmentId);
  const { data: catalog, isLoading: catalogLoading } = usePermissionCatalog();
  const { data: grants, isLoading: grantsLoading } = useGrants(
    "department",
    departmentId,
  );
  const saveGrants = useSaveGrants();

  if (isLoading) return <LoadingPage label="جاري تحميل القسم..." />;
  if (error || !department)
    return (
      <ErrorPage
        error={error instanceof Error ? error.message : "القسم غير موجود"}
        label="خطأ في تحميل القسم"
      />
    );

  const displayName = department.name_ar || department.name;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 py-6 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto space-y-4">
        <BackButton />

        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <h1 className="text-xl font-semibold text-gray-900">{displayName}</h1>
          <p className="text-xs text-gray-400 mt-1" dir="ltr">
            {department.name} · {department.code}
          </p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="flex gap-6 px-4 pt-3 border-b border-gray-200 text-sm">
            <button
              onClick={() => setTab("members")}
              className={`pb-2 transition-colors ${
                tab === "members"
                  ? "border-b-2 border-primary text-primary font-medium"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              الأعضاء ({members?.length ?? 0})
            </button>
            <button
              onClick={() => setTab("permissions")}
              className={`pb-2 transition-colors ${
                tab === "permissions"
                  ? "border-b-2 border-primary text-primary font-medium"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              الصلاحيات
            </button>
          </div>

          <div className="p-4">
            {tab === "members" && (
              <DepartmentMembersTab departmentId={departmentId} />
            )}

            {tab === "permissions" && (
              <>
                {catalogLoading || grantsLoading ? (
                  <LoadingPage label="جاري تحميل الصلاحيات..." />
                ) : (
                  <PermissionEditor
                    catalog={catalog ?? []}
                    savedGrants={grants ?? []}
                    subjectPhrase={`أي شخص في قسم ${displayName}`}
                    saving={saveGrants.isPending}
                    onSave={async (diff) => {
                      await saveGrants.mutateAsync({
                        layer: "department",
                        ownerId: departmentId,
                        diff,
                        grantedBy: user?.id ?? null,
                      });
                    }}
                  />
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
