import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2 } from "lucide-react";
import {
  RoundForm,
  roundSchemaValues,
} from "../../../../types/schema/contracts.schema";
import { useCreateRound } from "../../../../hooks/operations/contracts/rounds/useRounds";
import {
  AttachmentDraft,
  Specializations,
} from "../../../../types/global.type";
import { SearchableSelectField } from "../../../ui/inputs/SearchableSelectField";
import { TextField } from "../../../ui/inputs/TextField";
import { TextAreaField } from "../../../ui/inputs/TextAreaField";
import Separator from "../../../ui/separator";
import ConfirmDialog from "../../../ui/ConfirmDialog";
import { uploadFile } from "../../../../lib/storage-client";
import BOQItemPickerDialog from "./BOQItemPickerDialog";

interface NewRoundFormProps {
  projectId: string;
  specializations: Specializations[];
  specLoading: boolean;
}

const NewRoundForm = ({
  projectId,
  specializations,
  specLoading,
}: NewRoundFormProps) => {
  const navigate = useNavigate();
  const { createRound, loading } = useCreateRound();
  const [showPicker, setShowPicker] = useState(false);
  const [files, setFiles] = useState<AttachmentDraft[]>([]);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<RoundForm>({
    resolver: zodResolver(roundSchemaValues),
    defaultValues: {
      specialization_id: null,
      title: "",
      notes: "",
      items: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  const specOptions = specializations.map((s) => ({
    value: s.id,
    label: s.name,
  }));

  const handlePickerConfirm = (items: RoundForm["items"]) => {
    items.forEach((item) => append(item));
    setShowPicker(false);
  };

  const onSubmit = async (data: RoundForm) => {
    const { error, roundId } = await createRound(data, projectId);
    if (error || !roundId) {
      alert("خطأ في إنشاء جولة التسعير: " + error?.message);
      return;
    }
    for (const item of files) {
      await uploadFile({
        file: item.file,
        entityType: "round",
        entityId: roundId,
        title: item.title,
      });
    }
    navigate(`/operations/contracts/project/${projectId}/rounds/${roundId}`);
  };

  const handleAddFile = (file: File) => {
    setFiles((prev) => [
      ...prev,
      {
        file,
        title: file.name.replace(/\.[^/.]+$/, ""),
        preview: file.type.startsWith("image/")
          ? URL.createObjectURL(file)
          : undefined,
      },
    ]);
  };

  useEffect(() => {
    return () => {
      files.forEach((f) => {
        if (f.preview) URL.revokeObjectURL(f.preview);
      });
    };
  }, [files]);

  const alreadySelectedBoqItemIds = fields
    .map((f) => f.boq_item_id)
    .filter((id): id is string => !!id);

  return (
    <>
      {showPicker && (
        <BOQItemPickerDialog
          projectId={projectId}
          alreadySelectedBoqItemIds={alreadySelectedBoqItemIds}
          onConfirm={handlePickerConfirm}
          onClose={() => setShowPicker(false)}
        />
      )}

      <div className="max-w-5xl mx-auto p-6 bg-white rounded-lg shadow-sm">
        <h1 className="text-2xl font-semibold mb-6">جولة تسعير جديدة</h1>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          {/* ── General Info ─────────────────────────────────────────────── */}
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
                  value={field.value ?? ""}
                  onChange={field.onChange}
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
                id="notes"
                label="ملاحظات"
                register={register("notes")}
                error={errors.notes}
              />
            </div>
          </div>

          <Separator />

          {/* ── Items ─────────────────────────────────────────────────────── */}
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-gray-500">البنود</p>
            <button
              type="button"
              onClick={() => setShowPicker(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-blue-600 text-blue-600 text-sm hover:bg-blue-50 transition-colors"
            >
              <Plus className="w-4 h-4" />
              إضافة بنود من قائمة الكميات
            </button>
          </div>

          {typeof errors.items?.message === "string" && (
            <p className="text-sm text-red-500 mb-2">
              {errors.items.message}
            </p>
          )}

          {fields.length === 0 ? (
            <div className="border-2 border-dashed rounded-lg p-8 text-center text-gray-400 text-sm">
              لم يتم إضافة أي بنود بعد
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <div className="grid grid-cols-12 gap-2 px-4 py-2 bg-gray-50 text-xs font-semibold text-gray-500 border-b">
                <span className="col-span-6">البند</span>
                <span className="col-span-2">الوحدة</span>
                <span className="col-span-3">الكمية</span>
                <span className="col-span-1" />
              </div>
              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className="grid grid-cols-12 gap-2 px-4 py-3 items-center border-b last:border-0"
                >
                  <div className="col-span-6">
                    <p className="text-sm font-medium truncate">
                      {field.name}
                    </p>
                    {!field.boq_item_id && (
                      <span className="text-xs text-amber-600">
                        بند مخصص
                      </span>
                    )}
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-gray-500">{field.unit}</p>
                  </div>
                  <div className="col-span-3">
                    <input
                      type="number"
                      min={0}
                      step="any"
                      {...register(`items.${index}.quantity`, {
                        valueAsNumber: true,
                        setValueAs: (v) => (v === "" ? 0 : Number(v)),
                      })}
                      className="w-full border rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    {errors.items?.[index]?.quantity && (
                      <p className="text-xs text-red-500 mt-0.5">
                        {errors.items[index]?.quantity?.message}
                      </p>
                    )}
                  </div>
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

          {/* ── Attachments ───────────────────────────────────────────────── */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-500">المرفقات</p>
              <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-blue-600 text-blue-600 text-sm hover:bg-blue-50 transition-colors">
                <Plus className="w-4 h-4" />
                إضافة ملفات
                <input
                  type="file"
                  multiple
                  hidden
                  onChange={(e) => {
                    Array.from(e.target.files || []).forEach(handleAddFile);
                  }}
                />
              </label>
            </div>
            {files.length === 0 ? (
              <div className="border-2 border-dashed rounded-lg p-8 text-center text-gray-400 text-sm">
                لا توجد مرفقات
              </div>
            ) : (
              <div className="space-y-3">
                {files.map((item, index) => {
                  const isImage = item.file.type.startsWith("image/");
                  return (
                    <div
                      key={index}
                      className="border rounded-xl p-3 flex gap-4 items-start"
                    >
                      <div className="w-20 h-20 rounded-lg overflow-hidden border bg-gray-50 flex items-center justify-center shrink-0">
                        {isImage && item.preview ? (
                          <img
                            src={item.preview}
                            alt={item.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="text-xs text-gray-400 text-center px-2">
                            {item.file.type.includes("pdf")
                              ? "PDF"
                              : item.file.name.split(".").pop()?.toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0 space-y-2">
                        <input
                          type="text"
                          value={item.title}
                          onChange={(e) => {
                            const f = [...files];
                            f[index].title = e.target.value;
                            setFiles(f);
                          }}
                          placeholder="عنوان الملف"
                          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                        <div className="text-xs text-gray-500 space-y-1">
                          <p className="truncate">{item.file.name}</p>
                          <p>{(item.file.size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setFiles((prev) => prev.filter((_, i) => i !== index))
                        }
                        className="text-red-400 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── Footer ────────────────────────────────────────────────────── */}
          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-6 py-2 rounded-lg border text-sm hover:bg-gray-50 transition-colors"
            >
              إلغاء
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => setConfirmOpen(true)}
              className="px-6 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {loading ? "جاري الحفظ..." : "حفظ الجولة"}
            </button>
          </div>

          <ConfirmDialog
            open={confirmOpen}
            onCancel={() => setConfirmOpen(false)}
            onConfirm={() => {
              setConfirmOpen(false);
              handleSubmit(onSubmit)();
            }}
            title="حفظ جولة التسعير"
            message="هل أنت متأكد من حفظ هذه الجولة كمسودة؟"
            confirmLabel="نعم، احفظ الجولة"
            confirmVariant="primary"
            loading={loading}
          />
        </form>
      </div>
    </>
  );
};

export default NewRoundForm;
