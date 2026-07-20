import { z } from "zod";

export const editVendorLimitFlowSchema = z.object({
  price_limit: z
    .string()
    .trim()
    .refine((v) => v === "" || !isNaN(Number(v)), "يجب أن يكون رقم")
    .transform((v) => (v === "" ? null : Number(v))),
  flow: z.enum(["1", "2"], {
    error: "اختر مسار العمل",
  }),
});

export type EditVendorLimitFlowFormValues = z.input<
  typeof editVendorLimitFlowSchema
>;
export type EditVendorLimitFlowParsed = z.output<
  typeof editVendorLimitFlowSchema
>;
