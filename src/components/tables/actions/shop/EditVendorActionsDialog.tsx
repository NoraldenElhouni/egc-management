import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X } from "lucide-react";
import { Vendor } from "../../../../types/global.type";
import {
  EditVendorLimitFlowFormValues,
  EditVendorLimitFlowParsed,
  editVendorLimitFlowSchema,
} from "../../../../types/schema/shop/editVendorLimitFlowSchema";
import Button from "../../../ui/Button";

type EditVendorActionsDialogProps = {
  vendor: Vendor;
  onUpdate: (
    id: string,
    payload: { price_limit: number | null; flow: 1 | 2 },
  ) => Promise<{ success: boolean; error?: unknown }>;
};

const EditVendorActionsDialog = ({
  vendor,
  onUpdate,
}: EditVendorActionsDialogProps) => {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<
    EditVendorLimitFlowFormValues, // input shape (strings, what the inputs/register bind to)
    unknown, // context, unused
    EditVendorLimitFlowParsed // output shape (after zod transform, what handleSubmit gives you)
  >({
    resolver: zodResolver(editVendorLimitFlowSchema),
    defaultValues: {
      price_limit: vendor.price_limit != null ? String(vendor.price_limit) : "",
      flow: vendor.flow === 2 ? "2" : "1",
    },
  });

  useEffect(() => {
    if (!open) return;

    reset({
      price_limit: vendor.price_limit != null ? String(vendor.price_limit) : "",
      flow: vendor.flow === 2 ? "2" : "1",
    });
    setSubmitError(null);

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, vendor, reset]);

  const onSubmit = handleSubmit(async (values) => {
    // values is already EditVendorLimitFlowParsed here (price_limit: number)
    // thanks to the resolver + third generic — no need to re-parse manually
    setIsSubmitting(true);
    setSubmitError(null);

    const result = await onUpdate(vendor.id, {
      price_limit: values.price_limit,
      flow: Number(values.flow) as 1 | 2,
    });

    setIsSubmitting(false);

    if (result.success) {
      setOpen(false);
    } else {
      setSubmitError("حدث خطأ أثناء الحفظ، حاول مرة أخرى");
    }
  });

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded border px-3 py-1 text-sm hover:bg-gray-50"
      >
        تعديل
      </button>
      {open && (
        <div className="fixed inset-0 z-[9999]">
          <button
            type="button"
            aria-label="Close dialog"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-black/40"
          />

          <div className="absolute left-1/2 top-1/2 w-[92%] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white p-4 shadow-lg">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold">
                تعديل البيانات {vendor.vendor_name}
              </h3>
              <Button
                type="button"
                onClick={() => setOpen(false)}
                variant="ghost"
              >
                <X size={20} />
              </Button>
            </div>

            <form onSubmit={onSubmit} className="mt-4 space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium">
                  الحد الأقصى للسعر{" "}
                  <span className="text-gray-400">(اختياري)</span>
                </label>
                <input
                  type="number"
                  step="any"
                  {...register("price_limit")}
                  className="w-full rounded border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  dir="ltr"
                  placeholder="بدون حد"
                />
                {errors.price_limit && (
                  <p className="mt-1 text-xs text-red-600">
                    {errors.price_limit.message}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">
                  مسار العمل
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-sm">
                    <input type="radio" value="1" {...register("flow")} />
                    مسار 1
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="radio" value="2" {...register("flow")} />
                    مسار 2
                  </label>
                </div>
                {errors.flow && (
                  <p className="mt-1 text-xs text-red-600">
                    {errors.flow.message}
                  </p>
                )}
              </div>

              {submitError && (
                <p className="text-xs text-red-600">{submitError}</p>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setOpen(false)}
                  disabled={isSubmitting}
                >
                  إلغاء
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "جاري الحفظ..." : "حفظ"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default EditVendorActionsDialog;
