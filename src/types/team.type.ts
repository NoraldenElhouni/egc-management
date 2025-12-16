import { Employees } from "./global.type";

export type TeamEmployee = Employees & {
  percentage?: number | null;
  role?: string | null;
  assignment_id?: string | null;
};
