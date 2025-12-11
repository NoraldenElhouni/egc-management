import { z } from "zod";

const employee = z.object({
  employee_id: z.string(),
  percentage: z.number().min(0).max(100),
  amount: z.number(),
});

const company = z.object({
  percentage: z.number().min(0).max(100),
  amount: z.number(),
});

const map = z
  .object({
    type_id: z.string(),
    description: z.string().min(1, "وصف الخريطة مطلوب"),
    price: z.number().min(0),
    quantity: z.number().min(0),
    total: z.number(),
    employee: z.array(employee),
    company: company,
  })
  .refine(
    (data) => {
      const employeeTotal = data.employee.reduce(
        (sum, emp) => sum + emp.percentage,
        0
      );
      const grandTotal = employeeTotal + data.company.percentage;
      return grandTotal === 100;
    },
    {
      message: "إجمالي النسب يجب أن يساوي 100% بالضبط",
      path: ["company", "percentage"],
    }
  );

export const MapsDistributionSchema = z.object({
  project_id: z.string(),
  map: z.array(map).min(1, "يجب إضافة خريطة واحدة على الأقل"),
  payment_method: z.enum(["cash", "bank", "check"]),
});

export type MapsDistributionValues = z.infer<typeof MapsDistributionSchema>;
