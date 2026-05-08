import { PostgrestError } from "@supabase/supabase-js";
import { Contractors, Specializations } from "../../../types/global.type";
import {
  Service,
  useCreateRequest,
} from "../../../hooks/operations/contracts/useContracts";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  RequestForm,
  requestSchemaValues,
} from "../../../types/schema/contracts.schema";
import { Controller, useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { SearchableSelectField } from "../../ui/inputs/SearchableSelectField";
import { TextField } from "../../ui/inputs/TextField";
import { TextAreaField } from "../../ui/inputs/TextAreaField";
import { DateField } from "../../ui/inputs/DateField";
import Separator from "../../ui/separator";
import { Trash2, Plus, X } from "lucide-react";

interface NewContractFormProps {
  specializations: Specializations[];
  specLoading: boolean;
  specError: PostgrestError | null;
  services: Service[];
  servLoading: boolean;
  servError: PostgrestError | null;
  selectSpec: string;
  onSpecChange: (id: string) => void;
  projectId: string;
  contractors: Contractors[];
  contractorsLoading: boolean;
  onBidModeChange: (mode: "open" | "direct") => void;
}

// ── Service Picker Dialog ─────────────────────────────────────────────────────
const ServicePickerDialog = ({
  services,
  loading,
  onConfirm,
  onClose,
  alreadySelected,
}: {
  services: Service[];
  loading: boolean;
  onConfirm: (selected: Service[]) => void;
  onClose: () => void;
  alreadySelected: string[]; // service ids already in the list
}) => {
  const [search, setSearch] = useState("");
  const [picked, setPicked] = useState<Service[]>([]);

  const filtered = services.filter(
    (s) =>
      !alreadySelected.includes(s.id) &&
      s.name.toLowerCase().includes(search.toLowerCase()),
  );

  // 👇 group by category name
  const grouped = filtered.reduce<Record<string, Service[]>>((acc, s) => {
    const cat = s.specialization_categories?.name ?? "عام";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(s);
    return acc;
  }, {});

  const toggle = (service: Service) => {
    setPicked((prev) =>
      prev.find((p) => p.id === service.id)
        ? prev.filter((p) => p.id !== service.id)
        : [...prev, service],
    );
  };

  return (
    // backdrop
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 flex flex-col max-h-[80vh]">
        {/* header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="font-semibold text-lg">اختر الخدمات</h2>
          <button onClick={onClose} type="button">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* search */}
        <div className="p-3 border-b">
          <input
            type="text"
            placeholder="ابحث عن خدمة..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* list */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {loading ? (
            <p className="text-center text-sm text-gray-400 py-8">
              جاري التحميل...
            </p>
          ) : filtered.length === 0 ? (
            <p className="text-center text-sm text-gray-400 py-8">
              لا توجد خدمات
            </p>
          ) : (
            Object.entries(grouped).map(([category, items]) => (
              <div key={category}>
                {/* category label */}
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-2 mb-1">
                  {category}
                </p>

                <div className="space-y-1">
                  {items.map((s) => {
                    const isChecked = !!picked.find((p) => p.id === s.id);
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => toggle(s)}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-right transition-colors ${
                          isChecked
                            ? "bg-blue-50 border border-blue-200"
                            : "hover:bg-gray-50 border border-transparent"
                        }`}
                      >
                        <input
                          type="checkbox"
                          readOnly
                          checked={isChecked}
                          className="w-4 h-4 accent-blue-600"
                        />
                        <div>
                          <p className="text-sm font-medium">{s.name}</p>
                          {s.unit && (
                            <p className="text-xs text-gray-400">{s.unit}</p>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* footer */}
        <div className="p-4 border-t flex items-center justify-between gap-3">
          <span className="text-sm text-gray-500">
            {picked.length > 0
              ? `تم اختيار ${picked.length}`
              : "لم يتم الاختيار"}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border text-sm hover:bg-gray-50"
            >
              إلغاء
            </button>
            <button
              type="button"
              disabled={picked.length === 0}
              onClick={() => onConfirm(picked)}
              className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700 disabled:opacity-50"
            >
              إضافة
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Main Form ─────────────────────────────────────────────────────────────────
const NewContractForm = ({
  specializations,
  specLoading,
  services,
  servLoading,
  onSpecChange,
  projectId,
  contractors,
  contractorsLoading,
  onBidModeChange,
}: NewContractFormProps) => {
  const [success, setSuccess] = useState<string | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const { createRequest, loading } = useCreateRequest();
  const navigate = useNavigate();

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
    watch,
    reset,
    setValue,
  } = useForm<RequestForm>({
    resolver: zodResolver(requestSchemaValues),
    defaultValues: { bid_mode: "open", items: [] },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  const bidMode = watch("bid_mode");
  const currentItems = watch("items");

  const specOptions = specializations.map((s) => ({
    value: s.id,
    label: s.name,
  }));
  const contractorOptions = contractors.map((c) => ({
    value: c.id,
    label: `${c.first_name} ${c.last_name ?? ""}`.trim(),
  }));

  const handleServicesConfirm = (selected: Service[]) => {
    selected.forEach((s) =>
      append({ id: s.id, name: s.name, unit: s.unit ?? "عدد", quantity: 1 }),
    );
    setShowDialog(false);
  };

  const onSubmit = async (data: RequestForm) => {
    const { error } = await createRequest(data, projectId);
    if (error) {
      alert("خطأ في إنشاء طلب العقد: " + error.message);
      return;
    }
    setSuccess("تم اضافة طلب العقد بنجاح");
    reset();
    navigate(-1);
  };

  return (
    <>
      {/* Service Picker Dialog */}
      {showDialog && (
        <ServicePickerDialog
          services={services}
          loading={servLoading}
          alreadySelected={currentItems.map((i) => i.id)}
          onConfirm={handleServicesConfirm}
          onClose={() => setShowDialog(false)}
        />
      )}

      <div className="max-w-5xl mx-auto p-6 bg-white rounded-lg shadow-sm">
        <h1 className="text-2xl font-semibold mb-6">اضافة طلب العقد</h1>

        {success && (
          <div className="mb-4 p-3 rounded text-sm bg-green-50 text-green-700">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          {/* ── Section 1: General Info ───────────────────────────────────── */}
          <p className="text-sm font-semibold text-gray-500 mb-3">
            المعلومات العامة
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Controller
              name="specialization_id"
              control={control}
              render={({ field }) => (
                <SearchableSelectField
                  id="specialization_id"
                  label="التخصص"
                  options={specOptions}
                  loading={specLoading}
                  value={field.value}
                  onChange={(val) => {
                    field.onChange(val);
                    onSpecChange(val);
                  }}
                  error={errors.specialization_id}
                  placeholder="-- اختر التخصص --"
                />
              )}
            />

            <TextField
              id="title"
              label="العنوان"
              register={register("title")}
              error={errors.title}
            />

            <div className="col-span-2">
              <TextAreaField
                id="description"
                label="الوصف"
                register={register("description")}
                error={errors.description}
              />
            </div>

            <DateField
              id="bid_deadline"
              label="آخر موعد للعروض"
              register={register("bid_deadline")}
              error={errors.bid_deadline}
            />
            <DateField
              id="work_start_at"
              label="تاريخ بدء العمل"
              register={register("work_start_at")}
              error={errors.work_start_at}
            />
          </div>

          <Separator />

          {/* ── Section 2: Mode Tabs ──────────────────────────────────────── */}
          <p className="text-sm font-semibold text-gray-500 mb-3">نوع العقد</p>
          <div className="flex gap-2 mb-4">
            {(["open", "direct"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => {
                  setValue("bid_mode", mode);
                  onBidModeChange(mode);
                }}
                className={`px-5 py-2 rounded-lg text-sm font-medium border transition-colors ${
                  bidMode === mode
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
                }`}
              >
                {mode === "open" ? "مفتوح" : "مباشر"}
              </button>
            ))}
          </div>

          {/* Direct contractor select */}
          {bidMode === "direct" && (
            <div className="mb-4 max-w-sm">
              <Controller
                name="direct_contractor_id"
                control={control}
                render={({ field }) => (
                  <SearchableSelectField
                    id="direct_contractor_id"
                    label="اختر المقاول"
                    options={contractorOptions}
                    loading={contractorsLoading}
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    error={errors.direct_contractor_id}
                    placeholder="-- اختر المقاول --"
                  />
                )}
              />
            </div>
          )}

          <Separator />

          {/* ── Section 3: Items ──────────────────────────────────────────── */}
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-gray-500">البنود</p>
            <button
              type="button"
              onClick={() => setShowDialog(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-blue-600 text-blue-600 text-sm hover:bg-blue-50 transition-colors"
            >
              <Plus className="w-4 h-4" />
              إضافة بند
            </button>
          </div>

          {errors.items?.root && (
            <p className="text-sm text-red-500 mb-2">
              {errors.items.root.message}
            </p>
          )}
          {/* root-level items error (min 1) */}
          {typeof errors.items?.message === "string" && (
            <p className="text-sm text-red-500 mb-2">{errors.items.message}</p>
          )}

          {fields.length === 0 ? (
            <div className="border-2 border-dashed rounded-lg p-8 text-center text-gray-400 text-sm">
              لم يتم إضافة أي بنود بعد
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              {/* table header */}
              <div className="grid grid-cols-12 gap-2 px-4 py-2 bg-gray-50 text-xs font-semibold text-gray-500 border-b">
                <span className="col-span-5">الخدمة</span>
                <span className="col-span-3">الوحدة</span>
                <span className="col-span-3">الكمية</span>
                <span className="col-span-1" />
              </div>

              {/* rows */}
              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className="grid grid-cols-12 gap-2 px-4 py-3 items-center border-b last:border-0"
                >
                  {/* name - read only */}
                  <p className="col-span-5 text-sm font-medium truncate">
                    {field.name}
                  </p>

                  {/* unit - read only */}
                  <p className="col-span-3 text-sm text-gray-500">
                    {field.unit}
                  </p>

                  {/* quantity - editable */}
                  <div className="col-span-3">
                    <input
                      type="number"
                      min={1}
                      {...register(`items.${index}.quantity`, {
                        valueAsNumber: true,
                        setValueAs: (v) => (v === "" ? 0 : Number(v)), // 👈 handle empty string
                      })}
                      className="w-full border rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    {errors.items?.[index]?.quantity && (
                      <p className="text-xs text-red-500 mt-0.5">
                        {errors.items[index].quantity?.message}
                      </p>
                    )}
                  </div>

                  {/* remove */}
                  <div className="col-span-1 flex justify-center">
                    <button
                      type="button"
                      onClick={() => remove(index)}
                      className="text-red-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <Separator />

          {/* ── Footer: Submit / Cancel ───────────────────────────────────── */}
          <div className="flex justify-end gap-3 mt-2">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-6 py-2 rounded-lg border text-sm hover:bg-gray-50 transition-colors"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {loading ? "جاري الحفظ..." : "حفظ الطلب"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

export default NewContractForm;
