// import { z } from "zod";

// const employee = z.object({
//   employee_id: z.string(),
//   percentage: z.number().min(0).max(100),
//   amount: z.number(),
// });

// const company = z.object({
//   percentage: z.number().min(0).max(100),
//   amount: z.number(),
// });

// const map = z.object({
//   type_id: z.string(),
//   price: z.number(),
//   quantity: z.number(),
//   total: z.number(),
// });

// export const MapsDistributionSchema = z.object({
//   project_id: z.string(),
//   employee: z.array(employee),
//   company: company,
//   description: z.string(),
//   map: z.array(map),
// });

// export type MapsDistributionValues = z.infer<typeof MapsDistributionSchema>;

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

const map = z.object({
  type_id: z.string(),
  price: z.number(),
  quantity: z.number(),
  total: z.number(),
  employee: z.array(employee),
  company: company,
});

export const MapsDistributionSchema = z.object({
  project_id: z.string(),
  description: z.string(),
  map: z.array(map),
});

export type MapsDistributionValues = z.infer<typeof MapsDistributionSchema>;
