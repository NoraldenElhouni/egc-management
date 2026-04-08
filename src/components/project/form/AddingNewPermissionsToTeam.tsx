import React, { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { SearchableSelectField } from "../../ui/inputs/SearchableSelectField";
import Button from "../../ui/Button";
import {
  usePermissions,
  useProjectUserPermissions,
} from "../../../hooks/team/usePermissions";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ProjectUserPermissionsSchema,
  ProjectUserPermissionsValue,
} from "../../../types/schema/ProjectUserPermissions";
import { Check, Plus, X } from "lucide-react";
import LoadingSpinner from "../../ui/LoadingSpinner";
import { useAuth } from "../../../hooks/useAuth"; // 👈 adjust path to your auth hook

interface AddingNewPermissionsToTeamProps {
  projectId: string;
  projectName: string;
  userId: string;
  userName: string;
  existingPermissionIds: string[];
  onSuccess?: () => void; // 👈 optional callback to refetch parent data
}

const AddingNewPermissionsToTeam = ({
  projectId,
  userId,
  projectName,
  userName,
  existingPermissionIds,
  onSuccess,
}: AddingNewPermissionsToTeamProps) => {
  const [success, setSuccess] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { permissions, loading } = usePermissions();
  const { grantPermission } = useProjectUserPermissions();
  const { user } = useAuth(); // 👈 get current user from your auth context

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ProjectUserPermissionsValue>({
    resolver: zodResolver(ProjectUserPermissionsSchema),
    defaultValues: {
      project_id: projectId,
      user_id: userId,
      permission_id: "",
    },
  });

  const onSubmit = async (values: ProjectUserPermissionsValue) => {
    setIsSubmitting(true);
    setSubmitError(null);
    setSuccess(null);

    const { error } = await grantPermission({
      user_id: values.user_id,
      project_id: values.project_id,
      permission_id: values.permission_id,
      granted_by: user?.id, // 👈 from auth context
    });

    if (error) {
      setSubmitError("حدث خطأ أثناء إضافة الصلاحية");
    } else {
      setSuccess("تمت إضافة الصلاحية بنجاح");
      reset();
      onSuccess?.(); // 👈 trigger parent refetch if provided
    }

    setIsSubmitting(false);
  };

  const availablePermissions = permissions.filter(
    (per) => !existingPermissionIds.includes(per.id),
  );

  return (
    <div
      className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6"
      dir="rtl"
    >
      {/* Card Header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center">
          <Plus className="w-5 h-5 text-emerald-600" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-gray-900">
            إضافة صلاحية جديدة
          </h3>
          <p className="text-xs text-gray-500">
            للمشروع:{" "}
            <span className="font-medium text-indigo-600">{projectName}</span>
          </p>
        </div>
      </div>

      {/* Alerts */}
      {success && (
        <div className="mb-4 flex items-center gap-2 p-3 rounded-xl text-sm bg-emerald-50 text-emerald-700 border border-emerald-200">
          <Check className="w-4 h-4 shrink-0" />
          {success}
        </div>
      )}
      {submitError && (
        <div className="mb-4 flex items-center gap-2 p-3 rounded-xl text-sm bg-red-50 text-red-700 border border-red-200">
          <X className="w-4 h-4 shrink-0" />
          {submitError}
        </div>
      )}

      {/* No permissions left */}
      {!loading && availablePermissions.length === 0 && (
        <div className="mb-4 flex items-center gap-2 p-3 rounded-xl text-sm bg-gray-50 text-gray-500 border border-gray-200">
          <Check className="w-4 h-4 shrink-0 text-gray-400" />
          تم تعيين جميع الصلاحيات المتاحة لهذا المستخدم
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          {/* User Badge */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">
              المستخدم
            </label>
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50">
              <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                <span className="text-indigo-700 text-xs font-bold">
                  {userName?.[0]}
                </span>
              </div>
              <span className="text-gray-800 font-medium text-sm">
                {userName}
              </span>
            </div>
          </div>

          {/* Permission Select */}
          <div>
            <Controller
              name="permission_id" // 👈 fixed: was "user_id" by mistake
              control={control}
              render={({ field }) => (
                <SearchableSelectField
                  id="permission_id"
                  label="الصلاحية"
                  value={field.value}
                  onChange={field.onChange}
                  options={availablePermissions.map((per) => ({
                    label: per.name,
                    value: per.id,
                  }))}
                  error={errors.permission_id} // 👈 fixed: was errors.user_id
                  placeholder={
                    loading
                      ? "جاري التحميل..."
                      : availablePermissions.length === 0
                        ? "لا توجد صلاحيات متاحة"
                        : "-- اختر الصلاحية --"
                  }
                  disabled={
                    isSubmitting || loading || availablePermissions.length === 0
                  }
                />
              )}
            />
          </div>

          {/* Submit */}
          <Button
            type="submit"
            disabled={isSubmitting || availablePermissions.length === 0}
            className="w-full"
          >
            {isSubmitting ? <LoadingSpinner /> : "إضافة الصلاحية"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default AddingNewPermissionsToTeam;
