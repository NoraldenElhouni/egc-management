import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Dialog from "../../ui/Dialog";
import Button from "../../ui/Button";
import { SelectField } from "../../ui/inputs/SelectField";
import { ArticleFull } from "../../../hooks/operations/boq/types";
import { BOQType } from "../../../hooks/operations/boq/useTypes";
import { Zone } from "../../../hooks/operations/boq/useZones";
import {
  BOQReportRequest,
  buildNode,
  buildSummaryItems,
  flattenItemsByZone,
} from "../../../hooks/operations/boq/boqPdfPayload";

const SCOPE_OPTIONS = [
  { value: "type", label: "النوع بالكامل" },
  { value: "article", label: "فصل معين" },
  { value: "work", label: "عمل معين" },
  { value: "zone", label: "منطقة معينة" },
  { value: "summary", label: "ملخص الكميات" },
];

const OptionsSchema = z
  .object({
    scope: z.enum(["type", "article", "work", "zone", "summary"]),
    articleId: z.string().optional(),
    workId: z.string().optional(),
    zoneId: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.scope === "article" && !data.articleId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["articleId"],
        message: "اختر فصل",
      });
    }
    if (data.scope === "work") {
      if (!data.articleId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["articleId"],
          message: "اختر فصل",
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
    if (data.scope === "zone" && !data.zoneId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["zoneId"],
        message: "اختر منطقة",
      });
    }
  });

type OptionsFormValues = z.infer<typeof OptionsSchema>;

const DEFAULT_VALUES: OptionsFormValues = {
  scope: "type",
  articleId: "",
  workId: "",
  zoneId: "",
};

type BOQPDFOptionsDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (payload: BOQReportRequest) => void;
  currentType: BOQType;
  articles: ArticleFull[];
  zones: Zone[];
  projectName: string;
};

const BOQPDFOptionsDialog: React.FC<BOQPDFOptionsDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  currentType,
  articles,
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
  const articleId = watch("articleId");

  useEffect(() => {
    if (isOpen) reset(DEFAULT_VALUES);
  }, [isOpen, reset]);

  useEffect(() => {
    setValue("articleId", "");
    setValue("workId", "");
    setValue("zoneId", "");
  }, [scope, setValue]);

  useEffect(() => {
    setValue("workId", "");
  }, [articleId, setValue]);

  const selectedArticle = articles.find((a) => a.id === articleId);

  const onSubmit = (values: OptionsFormValues) => {
    const generated_at = new Date().toISOString();

    switch (values.scope) {
      case "type": {
        onConfirm({
          report_title: currentType.name,
          project_name: projectName,
          generated_at,
          nodes: [buildNode({ kind: "type", type: currentType, articles }, zones)],
        });
        return;
      }
      case "article": {
        const article = articles.find((a) => a.id === values.articleId);
        if (!article) return;
        onConfirm({
          report_title: article.name,
          project_name: projectName,
          generated_at,
          nodes: [buildNode({ kind: "article", article }, zones)],
        });
        return;
      }
      case "work": {
        const article = articles.find((a) => a.id === values.articleId);
        const work = article?.works.find((w) => w.id === values.workId);
        if (!work) return;
        onConfirm({
          report_title: work.name,
          project_name: projectName,
          generated_at,
          nodes: [buildNode({ kind: "work", work }, zones)],
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
          items: flattenItemsByZone(articles, zone.id),
        });
        return;
      }
      case "summary": {
        onConfirm({
          report_title: "ملخص الكميات",
          project_name: projectName,
          generated_at,
          items: buildSummaryItems(articles),
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

        {scope === "article" && (
          <SelectField
            id="pdf-article"
            label="الفصل"
            options={articles.map((a) => ({ value: a.id, label: a.name }))}
            register={register("articleId")}
            error={errors.articleId}
          />
        )}

        {scope === "work" && (
          <>
            <SelectField
              id="pdf-work-article"
              label="الفصل"
              options={articles.map((a) => ({ value: a.id, label: a.name }))}
              register={register("articleId")}
              error={errors.articleId}
            />
            <SelectField
              id="pdf-work"
              label="العمل"
              options={(selectedArticle?.works ?? []).map((w) => ({
                value: w.id,
                label: w.name,
              }))}
              register={register("workId")}
              error={errors.workId}
            />
          </>
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
