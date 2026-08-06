import React, { useEffect, useMemo, useState } from "react";
import { useForm, useController } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Dialog from "../../ui/Dialog";
import Button from "../../ui/Button";
import { SelectField } from "../../ui/inputs/SelectField";
import { NumberField } from "../../ui/inputs/NumberField";
import { WorkFull } from "../../../hooks/operations/boq/types";
import { BOQType, fetchTypesByName } from "../../../hooks/operations/boq/useTypes";
import { fetchWorksForType } from "../../../hooks/operations/boq/useWorks";
import { Zone } from "../../../hooks/operations/boq/useZones";
import {
  BOQReportRequest,
  buildNode,
  buildSummaryItems,
  buildWorkSummaryNodes,
} from "../../../hooks/operations/boq/boqPdfPayload";
import { formatDate } from "../../../utils/helpper";

const SCOPE_OPTIONS = [
  { value: "type", label: "النوع بالكامل" },
  { value: "zone", label: "منطقة معينة" },
  { value: "work", label: "عمل معين" },
  { value: "summary", label: "ملخص الكميات" },
  { value: "work_summary", label: "ملخص الأعمال" },
  { value: "version", label: "حسب الإصدار" },
];

const VERSION_MODE_OPTIONS = [
  { value: "base", label: "الإصدار الأساسي فقط" },
  { value: "range", label: "نطاق من الإصدارات" },
  { value: "all", label: "كل الإصدارات مجتمعة" },
];

const typeVersionLabel = (t: BOQType) =>
  `${t.name} — ${t.version === 0 ? "الأساسية" : `v${t.version}`}`;

const OptionsSchema = z
  .object({
    scope: z.enum(["type", "zone", "work", "summary", "work_summary", "version"]),
    typeIds: z.array(z.string()),
    zoneId: z.string().optional(),
    workId: z.string().optional(),
    versionTypeName: z.string().optional(),
    versionMode: z.string().optional(),
    versionFrom: z.number().optional(),
    versionTo: z.number().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.scope === "zone" && !data.zoneId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["zoneId"],
        message: "اختر منطقة",
      });
    }
    if (data.scope === "work") {
      if (!data.zoneId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["zoneId"],
          message: "اختر منطقة",
        });
      }
      if (!data.workId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["workId"],
          message: "اختر عمل",
        });
      }
    }
    if (data.scope === "type" && data.typeIds.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["typeIds"],
        message: "اختر نوعًا واحدًا على الأقل",
      });
    }
    if (data.scope === "version") {
      if (!data.versionTypeName) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["versionTypeName"],
          message: "اختر النوع",
        });
      }
      if (!data.versionMode) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["versionMode"],
          message: "اختر طريقة عرض الإصدارات",
        });
      } else if (data.versionMode === "range") {
        if (data.versionFrom == null) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["versionFrom"],
            message: "أدخل رقم الإصدار الأول",
          });
        }
        if (data.versionTo == null) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["versionTo"],
            message: "أدخل رقم الإصدار الأخير",
          });
        }
        if (
          data.versionFrom != null &&
          data.versionTo != null &&
          data.versionFrom > data.versionTo
        ) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["versionTo"],
            message: "يجب أن يكون الإصدار الأخير أكبر من أو يساوي الأول",
          });
        }
      }
    }
  });

type OptionsFormValues = z.infer<typeof OptionsSchema>;

const buildDefaultValues = (currentType: BOQType): OptionsFormValues => ({
  scope: "type",
  typeIds: [currentType.id],
  zoneId: "",
  workId: "",
  versionTypeName: "",
  versionMode: "",
  versionFrom: undefined,
  versionTo: undefined,
});

type BOQPDFOptionsDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (payload: BOQReportRequest) => void;
  currentType: BOQType;
  allTypes: BOQType[];
  works: WorkFull[];
  zones: Zone[];
  projectName: string;
};

const BOQPDFOptionsDialog: React.FC<BOQPDFOptionsDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  currentType,
  allTypes,
  works,
  zones,
  projectName,
}) => {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    control,
    formState: { errors },
  } = useForm<OptionsFormValues>({
    resolver: zodResolver(OptionsSchema),
    defaultValues: buildDefaultValues(currentType),
  });

  const [submitting, setSubmitting] = useState(false);

  const scope = watch("scope");
  const zoneId = watch("zoneId");
  const versionMode = watch("versionMode");

  const { field: typeIdsField } = useController({ control, name: "typeIds" });
  const selectedTypeIds: string[] = typeIdsField.value ?? [];

  const toggleTypeId = (id: string) => {
    const next = selectedTypeIds.includes(id)
      ? selectedTypeIds.filter((x) => x !== id)
      : [...selectedTypeIds, id];
    typeIdsField.onChange(next);
  };

  const typeNameOptions = useMemo(() => {
    const seen = new Set<string>();
    const result: { value: string; label: string }[] = [];
    allTypes.forEach((t) => {
      if (!seen.has(t.name)) {
        seen.add(t.name);
        result.push({ value: t.name, label: t.name });
      }
    });
    return result;
  }, [allTypes]);

  useEffect(() => {
    if (isOpen) reset(buildDefaultValues(currentType));
  }, [isOpen, currentType, reset]);

  useEffect(() => {
    setValue("zoneId", "");
    setValue("workId", "");
  }, [scope, setValue]);

  useEffect(() => {
    setValue("workId", "");
  }, [zoneId, setValue]);

  const worksInSelectedZone = works.filter((w) => w.zone_id === zoneId);

  const onSubmit = async (values: OptionsFormValues) => {
    const generated_at = formatDate(new Date().toISOString());

    switch (values.scope) {
      case "type": {
        const selectedTypes = allTypes.filter((t) =>
          values.typeIds.includes(t.id),
        );
        if (selectedTypes.length === 0) return;
        setSubmitting(true);
        try {
          const worksByType = await Promise.all(
            selectedTypes.map((t) => fetchWorksForType(t.id)),
          );
          const nodes = selectedTypes.map((t, i) =>
            buildNode({ kind: "type", type: t, works: worksByType[i], zones }),
          );
          const report_title =
            selectedTypes.length === 1
              ? `حصر كميات ${selectedTypes[0].name} - ${
                  selectedTypes[0].version === 0
                    ? "نسخه الاساسيه"
                    : selectedTypes[0].version
                }`
              : `حصر كميات - عدة أنواع (${selectedTypes
                  .map((t) => t.name)
                  .join("، ")})`;
          onConfirm({
            report_title,
            project_name: projectName,
            generated_at,
            nodes,
          });
        } finally {
          setSubmitting(false);
        }
        return;
      }
      case "zone": {
        const zone = zones.find((z) => z.id === values.zoneId);
        if (!zone) return;
        onConfirm({
          report_title: `حصر كميات ${zone.name}`,
          project_name: projectName,
          generated_at,
          nodes: [
            buildNode({
              kind: "zone",
              zone,
              works: works.filter((w) => w.zone_id === zone.id),
            }),
          ],
        });
        return;
      }
      case "work": {
        const work = works.find((w) => w.id === values.workId);
        if (!work) return;
        onConfirm({
          report_title: `حصر كميات ${work.name}`,
          project_name: projectName,
          generated_at,
          nodes: [buildNode({ kind: "work", work })],
        });
        return;
      }
      case "summary": {
        onConfirm({
          report_title: `${projectName}`,
          project_name: projectName,
          generated_at,
          items: buildSummaryItems(works),
        });
        return;
      }
      case "work_summary": {
        onConfirm({
          report_title: `ملخص الأعمال - ${currentType.name}`,
          project_name: projectName,
          generated_at,
          nodes: buildWorkSummaryNodes(works),
        });
        return;
      }
      case "version": {
        if (!values.versionTypeName || !values.versionMode) return;
        setSubmitting(true);
        try {
          const versions = await fetchTypesByName(
            currentType.project_id,
            values.versionTypeName,
          );
          if (versions.length === 0) return;

          if (values.versionMode === "base") {
            const base = versions.find((v) => v.version === 0) ?? versions[0];
            const baseWorks = await fetchWorksForType(base.id);
            onConfirm({
              report_title: `حصر كميات ${base.name} - نسخه الاساسيه`,
              project_name: projectName,
              generated_at,
              nodes: [
                buildNode({ kind: "type", type: base, works: baseWorks, zones }),
              ],
            });
            return;
          }

          const included =
            values.versionMode === "all"
              ? versions
              : versions.filter(
                  (v) =>
                    v.version >= (values.versionFrom ?? -Infinity) &&
                    v.version <= (values.versionTo ?? Infinity),
                );
          if (included.length === 0) return;

          const worksByVersion = await Promise.all(
            included.map((v) => fetchWorksForType(v.id)),
          );
          const allWorks = worksByVersion.flat();

          const report_title =
            values.versionMode === "all"
              ? `${values.versionTypeName} — جميع الإصدارات`
              : `${values.versionTypeName} — v${included[0].version} إلى v${
                  included[included.length - 1].version
                }`;

          onConfirm({
            report_title,
            project_name: projectName,
            generated_at,
            nodes: buildWorkSummaryNodes(allWorks),
          });
        } finally {
          setSubmitting(false);
        }
        return;
      }
    }
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose}>
      <form
        className="flex flex-col gap-4"
        onSubmit={handleSubmit(onSubmit)}
        noValidate
      >
        <h2 className="text-lg font-bold">طباعة تقرير حصر الكميات</h2>

        <SelectField
          id="pdf-scope"
          label="نوع التقرير"
          options={SCOPE_OPTIONS}
          register={register("scope")}
          error={errors.scope}
        />

        {scope === "type" && (
          <div>
            <div className="mb-2 text-sm font-medium">الأنواع</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 rounded border p-3">
              {allTypes.map((t) => (
                <label key={t.id} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={selectedTypeIds.includes(t.id)}
                    onChange={() => toggleTypeId(t.id)}
                  />
                  <span>{typeVersionLabel(t)}</span>
                </label>
              ))}
            </div>
            {errors.typeIds && (
              <p className="text-sm text-error mt-1">
                {errors.typeIds.message}
              </p>
            )}
          </div>
        )}

        {scope === "zone" && (
          <SelectField
            id="pdf-zone"
            label="المنطقة"
            options={zones.map((z) => ({ value: z.id, label: z.name }))}
            register={register("zoneId")}
            error={errors.zoneId}
          />
        )}

        {scope === "work" && (
          <>
            <SelectField
              id="pdf-work-zone"
              label="المنطقة"
              options={zones.map((z) => ({ value: z.id, label: z.name }))}
              register={register("zoneId")}
              error={errors.zoneId}
            />
            <SelectField
              id="pdf-work"
              label="العمل"
              options={worksInSelectedZone.map((w) => ({
                value: w.id,
                label: w.name,
              }))}
              register={register("workId")}
              error={errors.workId}
            />
          </>
        )}

        {scope === "version" && (
          <>
            <SelectField
              id="pdf-version-type-name"
              label="النوع"
              options={typeNameOptions}
              register={register("versionTypeName")}
              error={errors.versionTypeName}
            />
            <SelectField
              id="pdf-version-mode"
              label="الإصدارات"
              options={VERSION_MODE_OPTIONS}
              register={register("versionMode")}
              error={errors.versionMode}
            />
            {versionMode === "range" && (
              <div className="flex gap-2">
                <NumberField
                  id="pdf-version-from"
                  label="من إصدار"
                  step="1"
                  min={0}
                  register={register("versionFrom", { valueAsNumber: true })}
                  error={errors.versionFrom}
                />
                <NumberField
                  id="pdf-version-to"
                  label="إلى إصدار"
                  step="1"
                  min={0}
                  register={register("versionTo", { valueAsNumber: true })}
                  error={errors.versionTo}
                />
              </div>
            )}
          </>
        )}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            إلغاء
          </Button>
          <Button type="submit" loading={submitting}>
            إنشاء التقرير
          </Button>
        </div>
      </form>
    </Dialog>
  );
};

export default BOQPDFOptionsDialog;
