export const STATUS_OPTIONS = [
  { value: "active", label: "نشط" },
  { value: "inactive", label: "غير نشط" },
] as const;

export type EmployeeStatus = (typeof STATUS_OPTIONS)[number]["value"];
