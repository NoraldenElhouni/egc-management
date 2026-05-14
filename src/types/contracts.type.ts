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
    id: string;
    first_name: string;
    last_name: string | null;
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
