import React from "react";
import { useTeam } from "../../../../../hooks/team/useTeam";
import { useParams } from "react-router-dom";
import ErrorPage from "../../../../../components/ui/errorPage";
import LoadingPage from "../../../../../components/ui/LoadingPage";
import { getUserProjectPermissions } from "../../../../../hooks/team/usePermissions";

const TeamPermissions = () => {
  const { projectId, empId } = useParams<{
    projectId: string;
    empId: string;
  }>();

  if (!projectId || !empId) {
    return (
      <div className="p-4">
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

  if (loading) {
    return <LoadingPage label="تحميل الفريق..." />;
  }

  if (error) {
    return <ErrorPage error={error.message} label="خطأ في تحميل الفريق" />;
  }

  return (
    <div className="p-4 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          الصلاحيات المستخدم
        </h1>
        <p className="text-gray-600">إدارة الصلاحيات المستحدم في المشروع</p>
      </div>
      <div>
        {permission?.map((permission) => (
          <div key={permission.permission_id}>
            {permission.users.first_name}-{permission.permissions.name}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TeamPermissions;
