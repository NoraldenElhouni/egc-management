import React, { useEffect, useMemo, useState, useCallback } from "react";
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
import AddCategoryForm from "../../../../components/specializations/AddCategoryForm";
import CategoriesList from "../../../../components/specializations/CategoriesList";
import { supabase } from "../../../../lib/supabaseClient";

// ─── shared ui ─────────────────────────────────────────────────────────────
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
    {error && <p className="text-xs text-red-600">{error}</p>}
  </div>
);

// ─── types ─────────────────────────────────────────────────────────────────
type Mode = "direct" | "categorized" | null;

// ─── mode picker ───────────────────────────────────────────────────────────
const ModePicker = ({
  current,
  onSelect,
  switching,
}: {
  current: Mode;
  onSelect: (m: Mode) => void;
  switching: boolean; // true = switching from existing data (show warning style)
}) => (
  <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
    <h2 className="text-sm font-semibold text-gray-900 mb-1">
      {switching ? "تبديل طريقة تنظيم الخدمات" : "اختر طريقة تنظيم الخدمات"}
    </h2>
    <p className="text-xs text-gray-500 mb-5">
      {switching
        ? "⚠️ سيتم حذف جميع البيانات الحالية عند التبديل. هذا الإجراء لا يمكن التراجع عنه."
        : "يمكنك التبديل لاحقاً لكن سيتم حذف البيانات الموجودة."}
    </p>

    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <button
        onClick={() => onSelect("direct")}
        disabled={current === "direct"}
        className={[
          "group flex flex-col gap-2 rounded-xl border-2 p-4 text-right transition",
          current === "direct"
            ? "border-gray-900 bg-gray-50 cursor-default"
            : "border-gray-200 hover:border-gray-900 hover:bg-gray-50",
        ].join(" ")}
      >
        <div className="text-2xl">📋</div>
        <div className="text-sm font-semibold text-gray-800">خدمات مباشرة</div>
        <div className="text-xs text-gray-500">
          أضف الخدمات مباشرة بدون تصنيفات. مناسب للتخصصات البسيطة.
        </div>
        {current === "direct" && (
          <span className="text-xs text-gray-400 font-medium">
            ✓ الوضع الحالي
          </span>
        )}
      </button>

      <button
        onClick={() => onSelect("categorized")}
        disabled={current === "categorized"}
        className={[
          "group flex flex-col gap-2 rounded-xl border-2 p-4 text-right transition",
          current === "categorized"
            ? "border-gray-900 bg-gray-50 cursor-default"
            : "border-gray-200 hover:border-gray-900 hover:bg-gray-50",
        ].join(" ")}
      >
        <div className="text-2xl">🗂️</div>
        <div className="text-sm font-semibold text-gray-800">
          تصنيفات وخدمات
        </div>
        <div className="text-xs text-gray-500">
          قسّم الخدمات داخل تصنيفات. مناسب للتخصصات المعقدة.
        </div>
        {current === "categorized" && (
          <span className="text-xs text-gray-400 font-medium">
            ✓ الوضع الحالي
          </span>
        )}
      </button>
    </div>
  </div>
);

// ═══════════════════════════════════════════════════════════════════════════
const SpecializationsDetailsPage = () => {
  const params = useParams<{ id?: string }>();
  const id = params.id;

  const [editing, setEditing] = useState(false);
  const [addService, setAddService] = useState(false);
  const [addCategory, setAddCategory] = useState(false);
  const [mode, setMode] = useState<Mode>(null);
  const [showModePicker, setShowModePicker] = useState(false); // for the switch flow
  const [switching, setSwitching] = useState(false); // deleting in progress

  if (!id) return <div className="p-6">Specialization not found</div>;

  const {
    specialization: spec,
    categories,
    services,
    loading,
    submitError,
    updateSpecialization,
    refresh,
  } = useSpecializations(id);

  const handleRefresh = useCallback(() => refresh(), [refresh]);

  const hasData =
    (categories && categories.length > 0) || (services && services.length > 0);

  // Derive mode from existing data on load
  useEffect(() => {
    if (mode !== null) return;
    if (categories && categories.length > 0) {
      setMode("categorized");
    } else if (services && services.length > 0) {
      setMode("direct");
    }
  }, [categories, services]);

  // ── Switch mode: delete old data, then set new mode ────────────────────
  const handleSwitchMode = useCallback(
    async (newMode: Mode) => {
      if (newMode === mode) return;

      // If no data yet, just switch freely
      if (!hasData) {
        setMode(newMode);
        setShowModePicker(false);
        return;
      }

      const label =
        mode === "direct"
          ? "جميع الخدمات المضافة"
          : "جميع التصنيفات والخدمات بداخلها";

      const confirmed = window.confirm(
        `سيتم حذف ${label} نهائياً عند التبديل. هل أنت متأكد؟`,
      );
      if (!confirmed) return;

      setSwitching(true);
      try {
        if (mode === "direct") {
          // Delete all services for this specialization
          const { error } = await supabase
            .from("services")
            .delete()
            .eq("specialization_id", id);
          if (error) throw error;
        } else {
          // Delete categories — services linked via category_id will lose their
          // category reference (set category_id = null by DB cascade or we do it manually)
          // First nullify category_id on services, then delete categories
          const categoryIds = (categories ?? []).map((c) => c.id);

          if (categoryIds.length > 0) {
            // Remove category link from services
            await supabase
              .from("services")
              .update({ category_id: null })
              .in("category_id", categoryIds);

            // Delete the categories themselves
            const { error } = await supabase
              .from("specialization_categories")
              .delete()
              .in("id", categoryIds);
            if (error) throw error;
          }
        }

        setMode(newMode);
        setShowModePicker(false);
        setAddService(false);
        setAddCategory(false);
        await refresh();
      } catch (e) {
        console.error("Error switching mode:", e);
        alert("حدث خطأ أثناء التبديل. الرجاء المحاولة مرة أخرى.");
      } finally {
        setSwitching(false);
      }
    },
    [mode, hasData, id, categories, refresh],
  );

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

  if (loading && !spec) return <LoadingPage label="جاري تحميل التخصص" />;
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
                  className="inline-flex items-center justify-center rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 transition"
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
                    className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 transition disabled:opacity-60 disabled:cursor-not-allowed"
                    type="button"
                    onClick={handleSubmit(updateSpecialization)}
                    disabled={loading || !isDirty}
                  >
                    {loading ? "جارٍ الحفظ..." : "حفظ"}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Info + Permissions */}
        <div className="grid gap-4 md:grid-cols-2">
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

        {/* ── Mode section ── */}

        {/* No mode chosen yet */}
        {mode === null && (
          <ModePicker
            current={null}
            onSelect={handleSwitchMode}
            switching={false}
          />
        )}

        {mode !== null && (
          <>
            {/* Mode bar — always visible, with a "تبديل" button */}
            {!showModePicker && (
              <div className="flex items-center justify-between rounded-lg bg-gray-100 border border-gray-200 px-3 py-2">
                <span className="text-xs text-gray-600">
                  الوضع الحالي:{" "}
                  <span className="font-semibold text-gray-800">
                    {mode === "direct" ? "خدمات مباشرة" : "تصنيفات وخدمات"}
                  </span>
                </span>
                <button
                  onClick={() => setShowModePicker(true)}
                  disabled={switching}
                  className="text-xs px-2.5 py-1 rounded border border-gray-300 bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition disabled:opacity-50"
                >
                  تبديل
                </button>
              </div>
            )}

            {/* Mode picker (shown when switching) */}
            {showModePicker && (
              <div className="space-y-2">
                <ModePicker
                  current={mode}
                  onSelect={handleSwitchMode}
                  switching={!!hasData}
                />
                <div className="flex justify-end">
                  <button
                    onClick={() => setShowModePicker(false)}
                    className="text-xs text-gray-400 hover:text-gray-700 underline transition"
                  >
                    إلغاء
                  </button>
                </div>
              </div>
            )}

            {switching && (
              <div className="text-xs text-gray-500 px-1 animate-pulse">
                جاري حذف البيانات القديمة...
              </div>
            )}

            {/* DIRECT MODE */}
            {mode === "direct" && !showModePicker && (
              <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-semibold text-gray-900">
                    الخدمات
                  </h2>
                  {!addService && (
                    <button
                      onClick={() => setAddService(true)}
                      className="text-xs px-3 py-1.5 rounded-lg bg-gray-900 text-white hover:bg-gray-800"
                    >
                      + إضافة خدمة
                    </button>
                  )}
                </div>

                {addService && (
                  <AddServiceForm
                    specializationId={id}
                    onCancel={() => setAddService(false)}
                    onSuccess={() => {
                      handleRefresh();
                      setAddService(false);
                    }}
                  />
                )}

                <div className="mt-4">
                  <ServicesList
                    services={services || []}
                    onRefresh={handleRefresh}
                  />
                </div>
              </div>
            )}

            {/* CATEGORIZED MODE */}
            {mode === "categorized" && !showModePicker && (
              <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h2 className="text-sm font-semibold text-gray-900">
                      التصنيفات والخدمات
                    </h2>
                    <p className="text-xs text-gray-400 mt-0.5">
                      أضف تصنيفاً أولاً، ثم أضف الخدمات داخله.
                    </p>
                  </div>
                  {!addCategory && (
                    <button
                      onClick={() => setAddCategory(true)}
                      className="text-xs px-3 py-1.5 rounded-lg bg-gray-900 text-white hover:bg-gray-800"
                    >
                      + إضافة تصنيف
                    </button>
                  )}
                </div>

                {addCategory && (
                  <AddCategoryForm
                    specializationId={id}
                    onCancel={() => setAddCategory(false)}
                    onSuccess={() => {
                      handleRefresh();
                      setAddCategory(false);
                    }}
                  />
                )}

                <div className="mt-4">
                  <CategoriesList
                    categories={categories || []}
                    onRefresh={handleRefresh}
                  />
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default SpecializationsDetailsPage;
