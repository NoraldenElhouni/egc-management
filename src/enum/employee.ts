export const STATUS_OPTIONS = [
  { value: "active", label: "نشط" },
  { value: "inactive", label: "غير نشط" },
] as const;

export const EMPLOYEE_TYPE = [
  { value: "full-time", label: "دوام كامل" },
  { value: "part-time", label: "دوام جزئي" },
  { value: "contractor", label: "متعاقد" },
  { value: "intern", label: "متدرب" },
] as const;

export type EmployeeStatus = (typeof STATUS_OPTIONS)[number]["value"];
export type EmployeeType = (typeof EMPLOYEE_TYPE)[number]["value"];
