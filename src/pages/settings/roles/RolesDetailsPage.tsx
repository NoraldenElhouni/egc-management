import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { useRole } from "../../../hooks/settings/useRoles";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  RoleUpdateSchema,
  RoleUpdateValues,
} from "../../../types/schema/Role.schema";
import LoadingPage from "../../../components/ui/LoadingPage";
import ErrorPage from "../../../components/ui/errorPage";

const Field = ({
  label,
  value,
}: {
  label: string;
  value?: React.ReactNode;
}) => (
  <div className="space-y-0.5">
    <div className="text-xs font-medium text-gray-500">{label}</div>
    <div className="text-sm font-semibold text-gray-900">{value}</div>
  </div>
);

const Input = ({
  label,
  placeholder,
  error,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
}) => (
  <div className="space-y-1">
    <label className="text-xs font-medium text-gray-600">{label}</label>
    <input
      {...props}
      placeholder={placeholder}
      className={[
        "w-full rounded-lg border bg-white px-3 py-2 text-sm outline-none transition",
        "border-gray-200 focus:border-gray-400 focus:ring-2 focus:ring-gray-100",
        error ? "border-red-300 focus:ring-red-100" : "",
      ].join(" ")}
    />
    {error ? <p className="text-xs text-red-600">{error}</p> : null}
  </div>
);

const RolesDetailsPage = () => {
  const params = useParams<{ id?: string }>();
  const id = params.id;

  if (!id) return <div className="p-6">Role not found</div>;

  const { role, loading, error, updateRole } = useRole(id);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
  } = useForm<RoleUpdateValues>({
    resolver: zodResolver(RoleUpdateSchema),
    defaultValues: { id, name: "", code: "" },
  });

  useEffect(() => {
    if (role) reset({ id, name: role.name || "", code: role.code || "" });
  }, [role, id, reset]);

  const permissions = useMemo(() => {
    const list =
      role?.role_permissions
        ?.map((rp) => rp.permissions?.name)
        .filter(Boolean) ?? [];
    if (list.length) return list as string[];

    return (role?.role_permissions
      ?.map((rp) => rp.permission_id)
      .filter(Boolean) ?? []) as string[];
  }, [role]);

  const onSubmit = async (data: RoleUpdateValues) => {
    setSaving(true);
    try {
      await updateRole(data);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingPage label="جاري تحميل الدور" />;
  if (error)
    return <ErrorPage error={error.message} label="خطأ في تحميل الدور" />;
  if (!role) return <div className="p-6">Role not found</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 py-6 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto space-y-4">
        {/* Header (compact like other settings pages) */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                تفاصيل الدور
              </h1>
              <p className="text-xs text-gray-600 mt-1">
                عرض معلومات الدور وتعديل الاسم/الكود عند الحاجة.
              </p>
            </div>

            <div className="flex items-center gap-2">
              {!editing ? (
                <button
                  className="inline-flex items-center justify-center rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 active:bg-gray-950 transition"
                  onClick={() => setEditing(true)}
                >
                  تعديل
                </button>
              ) : (
                <>
                  <button
                    className="inline-flex items-center justify-center rounded-lg bg-white px-4 py-2 text-sm font-medium text-gray-900 border border-gray-200 hover:bg-gray-50 transition"
                    type="button"
                    onClick={() => {
                      reset({
                        id,
                        name: role.name || "",
                        code: role.code || "",
                      });
                      setEditing(false);
                    }}
                  >
                    إلغاء
                  </button>

                  <button
                    className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 active:bg-emerald-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
                    type="button"
                    onClick={handleSubmit(onSubmit)}
                    disabled={saving || !isDirty}
                    title={!isDirty ? "لا توجد تغييرات للحفظ" : ""}
                  >
                    {saving ? "جارٍ الحفظ..." : "حفظ"}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Info Card */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-900">
                معلومات الدور
              </h2>
              <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-700">
                #{role.number}
              </span>
            </div>

            {!editing ? (
              <div className="grid gap-4">
                <Field label="الاسم" value={role.name} />
                <Field label="الكود" value={role.code} />
              </div>
            ) : (
              <form className="space-y-3" onSubmit={handleSubmit(onSubmit)}>
                <input type="hidden" {...register("id")} />

                <Input
                  label="الاسم"
                  placeholder="مثال: مدير النظام"
                  autoComplete="off"
                  {...register("name")}
                  error={
                    errors.name?.message ? String(errors.name.message) : ""
                  }
                />

                <Input
                  label="الكود"
                  placeholder="مثال: admin"
                  autoComplete="off"
                  {...register("code")}
                  error={
                    errors.code?.message ? String(errors.code.message) : ""
                  }
                />

                {/* Hidden submit to allow Enter */}
                <button type="submit" className="hidden" />
              </form>
            )}
          </div>

          {/* Permissions Card */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-900">الصلاحيات</h2>
              <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-700">
                {permissions.length} صلاحية
              </span>
            </div>

            {role.role_permissions.length ? (
              <ul className="flex flex-wrap gap-2">
                {role.role_permissions.map((rp) => (
                  <li
                    key={rp.permission_id}
                    className="px-2.5 py-1 rounded-full bg-gray-100 text-xs text-gray-800"
                  >
                    {rp.permissions?.name ?? "غير معروفة"}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-sm text-gray-400">لا توجد صلاحيات</div>
            )}
          </div>
        </div>

        {/* Footer hint */}
        {editing ? (
          <div className="text-xs text-gray-500 px-1">
            ملاحظة: زر <span className="font-semibold">حفظ</span> يتفعّل فقط
            عندما تغيّر القيم.
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default RolesDetailsPage;
