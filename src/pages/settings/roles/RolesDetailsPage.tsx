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
  <div className="space-y-1">
    <div className="text-xs font-medium text-slate-500">{label}</div>
    <div className="text-sm font-semibold text-slate-900">{value}</div>
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
    <label className="text-sm font-medium text-slate-700">{label}</label>
    <input
      {...props}
      placeholder={placeholder}
      className={[
        "w-full rounded-xl border bg-white px-3 py-2 text-sm outline-none transition",
        "border-slate-200 focus:border-slate-300 focus:ring-2 focus:ring-slate-200",
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
    if (role) {
      reset({ id, name: role.name || "", code: role.code || "" });
    }
  }, [role, id, reset]);

  const permissions = useMemo(() => {
    const list =
      role?.role_permissions
        ?.map((rp) => rp.permissions?.name)
        .filter(Boolean) ?? [];
    // fallback if permission object missing
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
    <div className="min-h-[calc(100vh-64px)] bg-slate-50 p-4 md:p-6">
      <div className="mx-auto max-w-4xl space-y-4">
        {/* Header */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 md:p-6 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
              <h1 className="text-xl md:text-2xl font-bold text-slate-900">
                تفاصيل الدور
              </h1>
              <p className="text-sm text-slate-500">
                عرض معلومات الدور وتعديل الاسم/الكود عند الحاجة.
              </p>
            </div>

            <div className="flex items-center gap-2">
              {!editing ? (
                <button
                  className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 active:bg-slate-950 transition"
                  onClick={() => setEditing(true)}
                >
                  تعديل
                </button>
              ) : (
                <>
                  <button
                    className="inline-flex items-center justify-center rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-900 border border-slate-200 hover:bg-slate-50 transition"
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
                    className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 active:bg-emerald-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
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
          <div className="rounded-2xl border border-slate-200 bg-white p-4 md:p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900">
                معلومات الدور
              </h2>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                #{role.number}
              </span>
            </div>

            {!editing ? (
              <div className="grid gap-4">
                <Field label="الاسم" value={role.name} />
                <Field label="الكود" value={role.code} />
              </div>
            ) : (
              <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
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
          <div className="rounded-2xl border border-slate-200 bg-white p-4 md:p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900">الصلاحيات</h2>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                {permissions.length} صلاحية
              </span>
            </div>

            {role.role_permissions.length ? (
              <ul className="flex flex-wrap gap-2">
                {role.role_permissions.map((rp) => (
                  <li
                    key={rp.permission_id}
                    className="px-3 py-1 rounded-full bg-slate-100 text-sm text-slate-800"
                  >
                    {rp.permissions?.name ?? "غير معروفة"}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-sm text-slate-400">لا توجد صلاحيات</div>
            )}
          </div>
        </div>

        {/* Footer hint */}
        {editing ? (
          <div className="text-xs text-slate-500 px-1">
            ملاحظة: زر <span className="font-semibold">حفظ</span> يتفعّل فقط
            عندما تغيّر القيم.
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default RolesDetailsPage;
