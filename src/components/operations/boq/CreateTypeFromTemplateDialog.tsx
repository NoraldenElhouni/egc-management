import React, { useEffect } from "react";
import { useForm, useController } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Dialog from "../../ui/Dialog";
import Button from "../../ui/Button";
import { SelectField } from "../../ui/inputs/SelectField";
import { NumberField } from "../../ui/inputs/NumberField";
import { BOQType } from "../../../hooks/operations/boq/useTypes";
import { useTemplateTypes } from "../../../hooks/operations/boq/useTemplateTypes";
import { useZones } from "../../../hooks/operations/boq/useZones";
import { useCreateTypeFromTemplate } from "../../../hooks/operations/boq/useCreateTypeFromTemplate";
import {
  CreateTypeFromTemplateFormValues,
  CreateTypeFromTemplateSchema,
} from "../../../types/schema/boq/createTypeFromTemplate.schema";

const DEFAULT_VALUES: CreateTypeFromTemplateFormValues = {
  template_type_id: "",
  version: 0,
  use_template: true,
  zone_ids: [],
};

type CreateTypeFromTemplateDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  existingTypes: BOQType[];
  onCreated: (newTypeId: string) => void;
};

const CreateTypeFromTemplateDialog: React.FC<
  CreateTypeFromTemplateDialogProps
> = ({ isOpen, onClose, projectId, existingTypes, onCreated }) => {
  const { templateTypes } = useTemplateTypes();
  const { zones } = useZones(projectId);
  const { createTypeFromTemplate, loading } = useCreateTypeFromTemplate();

  const {
    register,
    handleSubmit,
    watch,
    reset,
    control,
    setError,
    formState: { errors },
  } = useForm<CreateTypeFromTemplateFormValues>({
    resolver: zodResolver(CreateTypeFromTemplateSchema),
    defaultValues: DEFAULT_VALUES,
  });

  const [rpcError, setRpcError] = React.useState<string | null>(null);

  const useTemplate = watch("use_template");

  const { field: useTemplateField } = useController({
    control,
    name: "use_template",
  });
  const { field: zoneIdsField } = useController({ control, name: "zone_ids" });
  const selectedZoneIds: string[] = zoneIdsField.value ?? [];

  const toggleZoneId = (id: string) => {
    const next = selectedZoneIds.includes(id)
      ? selectedZoneIds.filter((x) => x !== id)
      : [...selectedZoneIds, id];
    zoneIdsField.onChange(next);
  };

  useEffect(() => {
    if (isOpen) {
      reset(DEFAULT_VALUES);
      setRpcError(null);
    }
  }, [isOpen, reset]);

  const onSubmit = async (values: CreateTypeFromTemplateFormValues) => {
    setRpcError(null);

    const templateType = templateTypes.find(
      (t) => t.id === values.template_type_id,
    );
    if (!templateType) return;

    const isDuplicate = existingTypes.some(
      (t) => t.name === templateType.name && t.version === values.version,
    );
    if (isDuplicate) {
      setError("version", {
        type: "manual",
        message: "يوجد بالفعل نوع بهذا الاسم وهذه النسخة في المشروع",
      });
      return;
    }

    const { data, error } = await createTypeFromTemplate({
      projectId,
      templateTypeId: values.template_type_id,
      version: values.version,
      useTemplate: values.use_template,
      zoneIds: values.use_template ? values.zone_ids : [],
    });

    if (error || !data) {
      setRpcError(error?.message ?? "حدث خطأ أثناء إنشاء النوع");
      return;
    }

    onCreated(data);
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose}>
      <form
        className="flex flex-col gap-4"
        onSubmit={handleSubmit(onSubmit)}
        noValidate
      >
        <h2 className="text-lg font-bold">نوع جديد</h2>

        <SelectField
          id="create-type-template"
          label="القالب"
          options={templateTypes.map((t) => ({ value: t.id, label: t.name }))}
          register={register("template_type_id")}
          error={errors.template_type_id}
        />

        <NumberField
          id="create-type-version"
          label="النسخة"
          step="1"
          min={0}
          register={register("version", { valueAsNumber: true })}
          error={errors.version}
        />

        <div>
          <div className="mb-2 text-sm font-medium">طريقة الإنشاء</div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => useTemplateField.onChange(true)}
              className={`flex-1 rounded border px-3 py-2 text-sm ${
                useTemplate
                  ? "border-primary bg-primary-superLight text-primary"
                  : "border-border text-foreground"
              }`}
            >
              استخدام قالب
            </button>
            <button
              type="button"
              onClick={() => useTemplateField.onChange(false)}
              className={`flex-1 rounded border px-3 py-2 text-sm ${
                !useTemplate
                  ? "border-primary bg-primary-superLight text-primary"
                  : "border-border text-foreground"
              }`}
            >
              بدء فارغ
            </button>
          </div>
        </div>

        {useTemplate && (
          <div>
            <div className="mb-2 text-sm font-medium">المناطق</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 rounded border p-3">
              {zones.map((zone) => (
                <label
                  key={zone.id}
                  className="flex items-center gap-2 text-sm"
                >
                  <input
                    type="checkbox"
                    checked={selectedZoneIds.includes(zone.id)}
                    onChange={() => toggleZoneId(zone.id)}
                  />
                  <span>{zone.name}</span>
                </label>
              ))}
            </div>
            {errors.zone_ids && (
              <p className="text-sm text-error mt-1">
                {errors.zone_ids.message}
              </p>
            )}
          </div>
        )}

        {rpcError && <p className="text-sm text-error">{rpcError}</p>}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            إلغاء
          </Button>
          <Button type="submit" loading={loading}>
            إنشاء
          </Button>
        </div>
      </form>
    </Dialog>
  );
};

export default CreateTypeFromTemplateDialog;
