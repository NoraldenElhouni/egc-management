import { formatDate } from "../../../utils/helpper";
import { ContractDetail } from "./useContracts";

export interface ContractPdfItem {
  name: string;
  unit: string;
  quantity: number;
  unit_price: number;
}

export interface ContractPdfMilestone {
  title: string;
  description?: string | null;
  percentage: number;
  amount: number;
  due_date?: string | null;
}

export interface ContractorContractPdfRequest {
  report_title?: string;
  project_name: string;
  contractor_name: string;
  generated_at: string;

  total_amount: number;
  insurance_percentage?: number;
  advance_percentage?: number;
  delay_penalty_per_day?: number | null;
  start_date?: string | null;
  duration_days?: number | null;
  end_date?: string | null;
  terms?: string | null;

  items?: ContractPdfItem[];
  milestones?: ContractPdfMilestone[];

  created_by_name?: string | null;
}

export function buildContractPdfPayload(
  contract: ContractDetail,
  createdByName?: string | null,
): ContractorContractPdfRequest {
  const contractorName = contract.contractor
    ? `${contract.contractor.first_name} ${contract.contractor.last_name ?? ""}`.trim()
    : "—";
  const title = contract.round?.title ?? "عقد مقاولة";

  return {
    report_title: `عقد ${title} - ${contractorName}`,
    project_name: contract.project?.name ?? "—",
    contractor_name: contractorName,
    generated_at: formatDate(new Date().toISOString()),

    total_amount: contract.total_amount,
    insurance_percentage: contract.insurance_percentage,
    advance_percentage: contract.advance_percentage,
    delay_penalty_per_day: contract.delay_penalty_per_day,
    start_date: contract.start_date,
    duration_days: contract.duration_days,
    end_date: contract.end_date,
    terms: contract.terms,

    items: contract.contract_items
      .slice()
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((item) => ({
        name: item.name,
        unit: item.unit,
        quantity: item.quantity,
        unit_price: item.unit_price,
      })),
    milestones: contract.milestones
      .slice()
      .sort((a, b) => a.order_index - b.order_index)
      .map((milestone) => ({
        title: milestone.title,
        description: milestone.description,
        percentage: milestone.percentage,
        amount: milestone.amount,
        due_date: milestone.due_date,
      })),

    created_by_name: createdByName,
  };
}
