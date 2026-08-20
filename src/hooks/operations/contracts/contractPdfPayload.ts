import { ContractDetail } from "./useContracts";
import { BOQReportRequest } from "../boq/boqPdfPayload";

// No dedicated /contract/pdf endpoint exists on the management API yet, so
// this reuses the BOQ report endpoint/shape for now: contract line items are
// sent as a flat items list, same as a simple BOQ items report.
export function buildContractAsBoqPayload(
  contract: ContractDetail,
): BOQReportRequest {
  const contractorName = contract.contractor
    ? `${contract.contractor.first_name} ${contract.contractor.last_name ?? ""}`.trim()
    : "—";
  const title = contract.round?.title ?? "عقد مقاولة";

  return {
    report_title: `عقد ${title} - ${contractorName}`,
    project_name: contract.project?.name ?? "—",
    generated_at: new Date().toISOString(),
    items: contract.contract_items
      .slice()
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((item) => ({
        name: item.name,
        unit: item.unit,
        quantity: item.quantity,
        unit_price: item.unit_price,
      })),
  };
}
