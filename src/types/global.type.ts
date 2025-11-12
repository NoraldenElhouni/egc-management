import { Tables } from "../../../../Fields/types/supabase";

export type Clients = Tables<"clients">;
export type Specializations = Tables<"specializations">;
export type Contractors = Tables<"contractors">;
export type Contracts = Tables<"contracts">;
export type ContractItems = Tables<"contract_items">;
export type ContractPayments = Tables<"contract_payments">;
export type Projects = Tables<"projects">;
export type Employees = Tables<"employees">;
export type Request = Tables<"requests">;
export type Bid = Tables<"bids">;
export type RequestItem = Tables<"request_items">;
export type ContractReport = Tables<"contract_reports">;
export type ProjectIncome = Tables<"project_incomes">;
export type Services = Tables<"services">;
export type ProjectExpenses = Tables<"project_expenses">;
export type Account = Tables<"accounts">;

export type Project = {
  address: string | null;
  client_id: string;
  code: string;
  created_at: string;
  description: string | null;
  id: string;
  latitude: number | null;
  longitude: number | null;
  name: string;
  percentage: number | null;
  percentage_taken: number;
  serial_number: number | null;
  status: "active" | "paused" | "completed" | "cancelled";
};
