import { Database } from "../lib/supabase";
import { ContractorBids } from "./global.type";

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

// Kept for src/hooks/supply-chain/useContractor.ts and
// src/components/tables/columns/contractors/BidsColumns.tsx — out of scope
// for the operations/contracts rewrite, still reads the legacy
// public.contractor_bids/work_requests tables directly.
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
