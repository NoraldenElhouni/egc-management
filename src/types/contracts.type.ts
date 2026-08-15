import { ContractorBids, WorkRequests, WorkRequestsItems } from "./global.type";
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

export interface ContractPayment extends ContractPaymentRow {
  contractor: ContractorSummary | null;
  project: ProjectSummary | null;
  created_by_employee: EmployeeSummary | null;
}

export interface ContractPaymentPenalty extends ContractPaymentPenaltyRow {
  contractor: ContractorSummary | null;
  project: ProjectSummary | null;
  linked_payment: { id: string; payments_number: string } | null;
  created_by_employee: EmployeeSummary | null;
}

export type RequestPage = WorkRequests & {
  projects: { name: string };
  work_request_items: WorkRequestsItems[];
  bids_count: number;
  specializations: {
    name: string;
  };
};

export interface RequestBids extends ContractorBids {
  contractors: {
    id: string;
    first_name: string;
    last_name: string | null;
  };
  work_requests: {
    id: string;
    title: string;
    project_id: string;
    projects: {
      id: string;
      name: string;
      expense_counter: number;
      invoice_counter: number; // add this
    };
  };
}

export interface ContractorBid extends ContractorBids {
  work_requests: {
    id: string;
    title: string;
    projects: {
      id: string;
      name: string;
    };
  };
}
