import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  SpecializationUpdateSchema,
  SpecializationUpdateValues,
} from "../../../../types/schema/Specialization.schema";
import { supabase } from "../../../../lib/supabaseClient";
import LoadingPage from "../../../../components/ui/LoadingPage";
import ErrorPage from "../../../../components/ui/errorPage";

type PermissionRow = {
  permission_id: string;
  permissions?: { id: string; name: string } | null;
};

type RoleRow = {
  id: string;
  name: string;
  code: string;
  number: number;
};

type SpecializationRow = {
  id: string;
  name: string;
  role_id: string;
  roles?: RoleRow | null;
  specialization_permissions?: PermissionRow[];
};

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

const SpecializationsDetailsPage = () => {
  const params = useParams<{ id?: string }>();
  const id = params.id;

  const [spec, setSpec] = useState<SpecializationRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<{ message: string } | null>(null);

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  if (!id) return <div className="p-6">Specialization not found</div>;

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
  } = useForm<SpecializationUpdateValues>({
    resolver: zodResolver(SpecializationUpdateSchema),
    defaultValues: { id, name: "" },
  });

  const load = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from("specializations")
        .select(
          `
          id,
          name,
          role_id,
          roles:role_id ( id, name, code, number ),
          specialization_permissions (
            permission_id,
            permissions:permission_id ( id, name )
          )
        `
        )
        .eq("id", id)
        .single();

      if (error) throw error;

      setSpec(data as SpecializationRow);
      reset({ id, name: (data as SpecializationRow).name || "" });
    } catch (e: unknown) {
      let msg = "خطأ في تحميل التخصص";
      if (e instanceof Error) {
        msg = e.message;
      } else if (
        typeof e === "object" &&
        e !== null &&
        "message" in e &&
        typeof (e as { message: unknown }).message === "string"
      ) {
        msg = (e as { message: string }).message;
      }
      setError({ message: msg });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  useEffect(() => {
    if (spec) reset({ id, name: spec.name || "" });
  }, [spec, id, reset]);

  const permissions = useMemo(() => {
    const list =
      spec?.specialization_permissions
        ?.map((sp) => sp.permissions?.name)
        .filter(Boolean) ?? [];

    if (list.length) return list as string[];

    // fallback if permission object missing
    return (spec?.specialization_permissions
      ?.map((sp) => sp.permission_id)
      .filter(Boolean) ?? []) as string[];
  }, [spec]);

  const onSubmit = async (data: SpecializationUpdateValues) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("specializations")
        .update({ name: data.name.trim() })
        .eq("id", data.id);

      if (error) throw error;

      setEditing(false);
      await load(); // refresh (also refresh permissions/role display)
    } catch (e: unknown) {
      // handle unique constraint nicely (role_id + lower(name))
      if (
        typeof e === "object" &&
        e !== null &&
        (e as { code?: string }).code === "23505"
      ) {
        setError({ message: "هذا التخصص موجود مسبقًا لنفس الدور" });
      } else {
        let msg = "فشل تحديث التخصص";
        if (e instanceof Error) {
          msg = e.message;
        } else if (
          typeof e === "object" &&
          e !== null &&
          "message" in e &&
          typeof (e as { message: unknown }).message === "string"
        ) {
          msg = (e as { message: string }).message;
        }
        setError({ message: msg });
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingPage label="جاري تحميل التخصص" />;
  if (error)
    return <ErrorPage error={error.message} label="خطأ في تحميل التخصص" />;
  if (!spec) return <div className="p-6">Specialization not found</div>;

  return (
    <div className="min-h-[calc(100vh-64px)] bg-slate-50 p-4 md:p-6">
      <div className="mx-auto max-w-4xl space-y-4">
        {/* Header */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 md:p-6 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
              <h1 className="text-xl md:text-2xl font-bold text-slate-900">
                تفاصيل التخصص
              </h1>
              <p className="text-sm text-slate-500">
                عرض معلومات التخصص وتعديل الاسم عند الحاجة.
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
                      reset({ id, name: spec.name || "" });
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
                معلومات التخصص
              </h2>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                #{spec.id.slice(0, 8)}
              </span>
            </div>

            {!editing ? (
              <div className="grid gap-4">
                <Field label="الاسم" value={spec.name} />
                <Field label="الدور" value={spec.roles?.name ?? "غير معروف"} />
                <Field label="كود الدور" value={spec.roles?.code ?? "-"} />
              </div>
            ) : (
              <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
                <input type="hidden" {...register("id")} />

                <Input
                  label="الاسم"
                  placeholder="مثال: كهرباء / مدني / سباكة"
                  autoComplete="off"
                  {...register("name")}
                  error={
                    errors.name?.message ? String(errors.name.message) : ""
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
              <h2 className="text-sm font-bold text-slate-900">
                صلاحيات التخصص
              </h2>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                {permissions.length} صلاحية
              </span>
            </div>

            {spec.specialization_permissions?.length ? (
              <ul className="flex flex-wrap gap-2">
                {spec.specialization_permissions.map((sp) => (
                  <li
                    key={sp.permission_id}
                    className="px-3 py-1 rounded-full bg-slate-100 text-sm text-slate-800"
                  >
                    {sp.permissions?.name ?? "غير معروفة"}
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

export default SpecializationsDetailsPage;
