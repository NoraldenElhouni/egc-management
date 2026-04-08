import { useParams } from "react-router-dom";
import ErrorPage from "../../../../../components/ui/errorPage";
import LoadingPage from "../../../../../components/ui/LoadingPage";
import { getUserProjectPermissions } from "../../../../../hooks/team/usePermissions";
import AddingNewPermissionsToTeam from "../../../../../components/project/form/AddingNewPermissionsToTeam";
import { ShieldCheckIcon } from "lucide-react";

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

  const { permission, loading, error, refetch } = getUserProjectPermissions(
    projectId,
    empId,
  );

  if (loading) return <LoadingPage label="تحميل الفريق..." />;

  if (error || !permission) {
    return (
      <ErrorPage
        error={error ? error.message : "خطأ في تحميل الفريق"}
        label="خطأ في تحميل الفريق"
      />
    );
  }

  const existingPermissionIds = permission.map((p) => p.permissions.id); // adjust field name if needed

  return (
    <div className="min-h-screen bg-gray-50 p-6" dir="rtl">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center">
              <ShieldCheckIcon />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                صلاحيات المستخدم
              </h1>
              <p className="text-gray-500 text-sm mt-0.5">
                إدارة صلاحيات المستخدم في المشروع
              </p>
            </div>
          </div>
        </div>

        {/* Add Permissions Form */}
        <AddingNewPermissionsToTeam
          projectId={projectId}
          projectName={permission[0].projects.name}
          userId={empId}
          userName={permission[0].users.first_name}
          existingPermissionIds={existingPermissionIds}
          onSuccess={refetch}
        />

        {/* Permissions List */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-base font-semibold text-gray-800">
              الصلاحيات الحالية
            </h2>
          </div>
          <ul className="divide-y divide-gray-100">
            {permission?.map((perm) => (
              <li
                key={perm.permission_id}
                className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                    <span className="text-indigo-700 text-sm font-semibold">
                      {perm.users.first_name?.[0]}
                    </span>
                  </div>
                  <span className="text-gray-800 font-medium">
                    {perm.users.first_name}
                  </span>
                </div>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
                  {perm.permissions.name}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default TeamPermissions;
