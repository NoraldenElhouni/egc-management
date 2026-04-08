import { useState } from "react";
import { useParams } from "react-router-dom";
import ErrorPage from "../../../../../components/ui/errorPage";
import LoadingPage from "../../../../../components/ui/LoadingPage";
import {
  getUserProjectPermissions,
  useProjectUserPermissions,
} from "../../../../../hooks/team/usePermissions";
import AddingNewPermissionsToTeam from "../../../../../components/project/form/AddingNewPermissionsToTeam";
import { ShieldCheckIcon, Trash2, Loader2 } from "lucide-react";

const TeamPermissions = () => {
  const { projectId, empId } = useParams<{
    projectId: string;
    empId: string;
  }>();

  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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

  const { revokePermission } = useProjectUserPermissions();

  if (loading) return <LoadingPage label="تحميل الفريق..." />;

  if (error || !permission) {
    return (
      <ErrorPage
        error={error ? error.message : "خطأ في تحميل الفريق"}
        label="خطأ في تحميل الفريق"
      />
    );
  }

  const existingPermissionIds = permission.map((p) => p.permissions.id);

  const handleDelete = async (permissionId: string) => {
    setDeletingId(permissionId);
    await revokePermission({
      user_id: empId,
      project_id: projectId,
      permission_id: permissionId,
    });
    setConfirmId(null);
    setDeletingId(null);
    refetch();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6" dir="rtl">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
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
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-800">
              الصلاحيات الحالية
            </h2>
            <span className="text-xs text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full">
              {permission.length} صلاحية
            </span>
          </div>

          {permission.length === 0 ? (
            <div className="px-6 py-12 text-center text-gray-400 text-sm">
              لا توجد صلاحيات مضافة
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {permission.map((perm) => {
                const isConfirming = confirmId === perm.permissions.id;
                const isDeleting = deletingId === perm.permissions.id;

                return (
                  <li
                    key={perm.permission_id}
                    className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors"
                  >
                    {/* Left: user info */}
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

                    {/* Right: badge + delete */}
                    <div className="flex items-center gap-3">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
                        {perm.permissions.name}
                      </span>

                      {isConfirming ? (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleDelete(perm.permissions.id)}
                            disabled={isDeleting}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-60"
                          >
                            {isDeleting ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              "تأكيد الحذف"
                            )}
                          </button>
                          <button
                            onClick={() => setConfirmId(null)}
                            disabled={isDeleting}
                            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                          >
                            إلغاء
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmId(perm.permissions.id)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                          title="حذف الصلاحية"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeamPermissions;
