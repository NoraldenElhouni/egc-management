import { Employees } from "./global.type";

export type TeamEmployee = Employees & {
  project_id: string;
  percentage?: number | null;
  role?: string | null;
  assignment_id?: string | null;
};
