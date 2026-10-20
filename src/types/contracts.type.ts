import { Database } from "../lib/supabase";

type ContractPaymentRow = Database["contracts"]["Tables"]["payments"]["Row"];
type ContractPaymentPenaltyRow =
  Database["contracts"]["Tables"]["payments_penalties"]["Row"];

type ContractorSummary = {
  id: string;
  first_name: string;
  last_name: string | null;
  whatsapp_number: string | null;
  bank_account_aproved: boolean | null;
};

type ProjectSummary = {
  id: string;
  name: string;
};

type EmployeeSummary = {
  id: string;
  first_name: string;
  last_name: string | null;
};

type ExpenseSummary = {
  id: string;
  description: string | null;
  serial_number: number | null;
};

export interface ContractPayment extends ContractPaymentRow {
  contractor: ContractorSummary | null;
  project: ProjectSummary | null;
  created_by_employee: EmployeeSummary | null;
  expense: ExpenseSummary | null;
}

export interface ContractPaymentPenalty extends ContractPaymentPenaltyRow {
  contractor: ContractorSummary | null;
  project: ProjectSummary | null;
  linked_payment: { id: string; payments_number: string } | null;
  created_by_employee: EmployeeSummary | null;
}

export interface ContractorNameRow {
  id: string;
  first_name: string;
  last_name: string | null;
}

export interface ContractListRow {
  id: string;
  project_id: string;
  round_id: string;
  quote_id: string;
  contractor_id: string;
  status: "draft" | "active" | "completed" | "cancelled";
  total_amount: number;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  rounds: { title: string } | null;
  contractor: ContractorNameRow | null;
}

