import { ContractorBids, WorkRequests, WorkRequestsItems } from "./global.type";

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
    first_name: string;
    last_name: string | null;
  };
}
