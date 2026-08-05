import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Dialog from "../../ui/Dialog";
import Button from "../../ui/Button";
import { SelectField } from "../../ui/inputs/SelectField";
import { WorkFull } from "../../../hooks/operations/boq/types";
import { BOQType } from "../../../hooks/operations/boq/useTypes";
import { Zone } from "../../../hooks/operations/boq/useZones";
import {
  BOQReportRequest,
  buildNode,
  buildSummaryItems,
} from "../../../hooks/operations/boq/boqPdfPayload";

const SCOPE_OPTIONS = [
  { value: "type", label: "النوع بالكامل" },
  { value: "zone", label: "منطقة معينة" },
  { value: "work", label: "عمل معين" },
  { value: "summary", label: "ملخص الكميات" },
];

const OptionsSchema = z
  .object({
    scope: z.enum(["type", "zone", "work", "summary"]),
    zoneId: z.string().optional(),
    workId: z.string().optional(),
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
  });

type OptionsFormValues = z.infer<typeof OptionsSchema>;

const DEFAULT_VALUES: OptionsFormValues = {
  scope: "type",
  zoneId: "",
  workId: "",
};

type BOQPDFOptionsDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (payload: BOQReportRequest) => void;
  currentType: BOQType;
  works: WorkFull[];
  zones: Zone[];
  projectName: string;
};

const BOQPDFOptionsDialog: React.FC<BOQPDFOptionsDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  currentType,
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
    formState: { errors },
  } = useForm<OptionsFormValues>({
    resolver: zodResolver(OptionsSchema),
    defaultValues: DEFAULT_VALUES,
  });

  const scope = watch("scope");
  const zoneId = watch("zoneId");

  useEffect(() => {
    if (isOpen) reset(DEFAULT_VALUES);
  }, [isOpen, reset]);

  useEffect(() => {
    setValue("zoneId", "");
    setValue("workId", "");
  }, [scope, setValue]);

  useEffect(() => {
    setValue("workId", "");
  }, [zoneId, setValue]);

  const worksInSelectedZone = works.filter((w) => w.zone_id === zoneId);

  const onSubmit = (values: OptionsFormValues) => {
    const generated_at = new Date().toISOString();

    switch (values.scope) {
      case "type": {
        onConfirm({
          report_title: `${currentType.name} — v${currentType.version}`,
          project_name: projectName,
          generated_at,
          nodes: [buildNode({ kind: "type", type: currentType, works, zones })],
        });
        return;
      }
      case "zone": {
        const zone = zones.find((z) => z.id === values.zoneId);
        if (!zone) return;
        onConfirm({
          report_title: zone.name,
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
          report_title: work.name,
          project_name: projectName,
          generated_at,
          nodes: [buildNode({ kind: "work", work })],
        });
        return;
      }
      case "summary": {
        onConfirm({
          report_title: "ملخص الكميات",
          project_name: projectName,
          generated_at,
          items: buildSummaryItems(works),
        });
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

        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            إلغاء
          </Button>
          <Button type="submit">إنشاء التقرير</Button>
        </div>
      </form>
    </Dialog>
  );
};

export default BOQPDFOptionsDialog;
