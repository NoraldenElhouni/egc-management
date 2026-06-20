import { useParams } from "react-router-dom";
import { ShieldCheckIcon } from "lucide-react";
import ErrorPage from "../../../../../components/ui/errorPage";
import LoadingPage from "../../../../../components/ui/LoadingPage";
import {
  getUserProjectPermissions,
  usePermissions,
  useProjectUserPermissions,
} from "../../../../../hooks/team/usePermissions";
import PermissionTree from "../../../../../components/project/PermissionTree";

const TeamPermissions = () => {
  const { projectId, empId } = useParams<{
    projectId: string;
    empId: string;
  }>();

  if (!projectId || !empId) {
    return (
      <div className="p-6">
        <ErrorPage
          error="رقم المشروع غير موجود في الرابط"
          label="خطأ في المعلومات"
        />
      </div>
    );
  }

  const {
    permissions: allPermissions,
    loading: permsLoading,
    error: permsError,
  } = usePermissions("project");

  const {
    permissions: assigned,
    user,
    project,
    loading,
    error,
    refetch,
  } = getUserProjectPermissions(projectId, empId);

  const { grantPermission, revokePermission } = useProjectUserPermissions();

  if (loading || permsLoading) {
    return <LoadingPage label="تحميل الصلاحيات..." />;
  }

  if (error || permsError || !project) {
    return (
      <ErrorPage
        error={
          error?.message ?? permsError?.message ?? "خطأ في تحميل الصلاحيات"
        }
        label="خطأ في تحميل الصلاحيات"
      />
    );
  }

  const userName = `${user?.first_name ?? ""} ${user?.last_name ?? ""}`.trim();

  return (
    <div className="min-h-screen bg-gray-50 p-6" dir="rtl">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Page header */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center">
              <ShieldCheckIcon className="text-indigo-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                صلاحيات المستخدم
              </h1>
              <p className="text-gray-500 text-sm mt-0.5">
                {userName && (
                  <span className="font-medium text-gray-700">{userName}</span>
                )}
                {userName && " — "}
                {project.name}
              </p>
            </div>
          </div>
        </div>

        {/* Permission tree */}
        <PermissionTree
          allPermissions={allPermissions}
          assignedPermissions={assigned ?? []}
          userId={empId}
          projectId={projectId}
          grantPermission={grantPermission}
          revokePermission={revokePermission}
          onPermissionChange={refetch}
        />
      </div>
    </div>
  );
};

export default TeamPermissions;
