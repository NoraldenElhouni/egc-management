import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  SpecializationUpdateSchema,
  SpecializationUpdateValues,
} from "../../../../types/schema/Specialization.schema";
import LoadingPage from "../../../../components/ui/LoadingPage";
import ErrorPage from "../../../../components/ui/errorPage";
import ServicesList from "../../../../components/specializations/ServicesList";
import AddServiceForm from "../../../../components/specializations/AddServiceForm";
import { useSpecializations } from "../../../../hooks/settings/useSpecializations";

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

const SpecializationsDetailsPage = () => {
  const params = useParams<{ id?: string }>();
  const id = params.id;

  const [editing, setEditing] = useState(false);

  const [addService, setAddService] = useState(false);

  if (!id) return <div className="p-6">Specialization not found</div>;

  const {
    specialization: spec,
    categories,
    services,
    loading,
    submitError,
    updateSpecialization,
  } = useSpecializations(id);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
  } = useForm<SpecializationUpdateValues>({
    resolver: zodResolver(SpecializationUpdateSchema),
    defaultValues: { id, name: "" },
  });

  useEffect(() => {
    if (spec) reset({ id, name: spec.name || "" });
  }, [spec, id, reset]);

  const permissions = useMemo(() => {
    const list =
      spec?.specialization_permissions
        ?.map((sp) => sp.permissions?.name)
        .filter(Boolean) ?? [];

    if (list.length) return list as string[];

    return (spec?.specialization_permissions
      ?.map((sp) => sp.permission_id)
      .filter(Boolean) ?? []) as string[];
  }, [spec]);

  if (loading) return <LoadingPage label="جاري تحميل التخصص" />;
  if (submitError)
    return <ErrorPage error={submitError} label="خطأ في تحميل التخصص" />;
  if (!spec) return <div className="p-6">Specialization not found</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 py-6 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto space-y-4">
        {/* Header */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                تفاصيل التخصص
              </h1>
              <p className="text-xs text-gray-600 mt-1">
                عرض معلومات التخصص وتعديل الاسم عند الحاجة.
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
                      reset({ id, name: spec.name || "" });
                      setEditing(false);
                    }}
                  >
                    إلغاء
                  </button>

                  <button
                    className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 active:bg-emerald-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
                    type="button"
                    onClick={handleSubmit(updateSpecialization)}
                    disabled={loading || !isDirty}
                    title={!isDirty ? "لا توجد تغييرات للحفظ" : ""}
                  >
                    {loading ? "جارٍ الحفظ..." : "حفظ"}
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
                معلومات التخصص
              </h2>
              <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-700">
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
              <form
                className="space-y-3"
                onSubmit={handleSubmit(updateSpecialization)}
              >
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

                <button type="submit" className="hidden" />
              </form>
            )}
          </div>

          {/* Permissions Card */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-900">
                صلاحيات التخصص
              </h2>
              <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-700">
                {permissions.length} صلاحية
              </span>
            </div>

            {spec.specialization_permissions?.length ? (
              <ul className="flex flex-wrap gap-2">
                {spec.specialization_permissions.map((sp) => (
                  <li
                    key={sp.permission_id}
                    className="px-2.5 py-1 rounded-full bg-gray-100 text-xs text-gray-800"
                  >
                    {sp.permissions?.name ?? "غير معروفة"}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-sm text-gray-400">لا توجد صلاحيات</div>
            )}
          </div>
        </div>

        {spec.roles?.name === "Vendor" ? (
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-900">الخدمات</h2>

              {!addService && (
                <button
                  onClick={() => setAddService(true)}
                  className="text-xs px-3 py-1.5 rounded-lg bg-gray-900 text-white hover:bg-gray-800"
                >
                  + إضافة خدمة
                </button>
              )}
            </div>

            {/* ✅ Add Form */}
            {addService && (
              <AddServiceForm
                specializationId={id}
                onSuccess={() => {
                  setAddService(false);
                  // reload services
                  (async () => {
                    console.log("Reloading services...");
                  })();
                }}
                onCancel={() => setAddService(false)}
              />
            )}

            {/* ✅ List */}
            <div className="mt-4">
              <ServicesList
                services={services || []}
                onRefresh={() => {
                  console.log("Refreshing services...");
                }}
              />
            </div>
          </div>
        ) : null}

        {categories?.length ? (
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">
              التصنيفات
            </h2>
          </div>
        ) : null}

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

export default SpecializationsDetailsPage;
