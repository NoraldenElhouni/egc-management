import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../lib/supabaseClient";
import type { Database } from "../../lib/supabase";

// task_links (build plan §4.14) is "the ERP bridge" — every record_type it
// can point at lives in a different module with its own route shape, so
// resolving "the real record" from a link means one branch per type here
// rather than a generic lookup. All seven happen to be project-scoped
// (every underlying table carries project_id), which is what makes the
// search-by-project picker below possible without per-type UI.
//
// Routes below were confirmed against each module's own *Routes.tsx as of
// this writing: shop_order has a real detail page; work_request,
// payment_request, and project_map have no detail page of their own yet
// (elsewhere in the app, not just here), so those fall back to the
// closest page that actually shows the record (the project, the
// contract's payment log, the project's book) rather than a dead link.

export type LinkRecordType = Database["tasks"]["Enums"]["link_record_type"];

export const RECORD_TYPE_LABELS: Record<LinkRecordType, string> = {
  shop_order: "طلب شراء",
  work_request: "طلب عمل",
  contract_round: "جولة عقد",
  contract: "عقد",
  payment_request: "طلب دفعة",
  expense: "مصروف",
  project_map: "خريطة المشروع",
};

/** Active record types that can be newly linked to a task */
export const LINKABLE_RECORD_TYPES: LinkRecordType[] = [
  "shop_order",
  "expense",
  "project_map",
];

export interface LinkedRecordInfo {
  label: string;
  url: string | null;
}

async function fetchRecordInfo(recordType: LinkRecordType, recordId: string): Promise<LinkedRecordInfo> {
  switch (recordType) {
    case "shop_order": {
      const { data } = await supabase
        .from("shop_orders")
        .select("id, project_id, note, vendor_ref, status")
        .eq("id", recordId)
        .maybeSingle();
      if (!data) return { label: "طلب شراء محذوف", url: null };
      return {
        label: data.vendor_ref || data.note || `طلب #${data.id.slice(0, 8)} — ${data.status}`,
        url: `/shops/orders/project/${data.project_id}/${data.id}`,
      };
    }
    case "expense": {
      const { data } = await supabase
        .from("project_expenses")
        .select("id, project_id, description, total_amount")
        .eq("id", recordId)
        .maybeSingle();
      if (!data) return { label: "مصروف محذوف", url: null };
      return {
        label: data.description || `مصروف — ${data.total_amount}`,
        url: `/finance/bookkeeping/project/${data.project_id}/expense/${data.id}`,
      };
    }
    case "project_map": {
      const { data } = await supabase
        .from("project_maps")
        .select("id, project_id, description, amount")
        .eq("id", recordId)
        .maybeSingle();
      if (!data) return { label: "بند خريطة محذوف", url: null };
      return {
        label: data.description || `بند خريطة — ${data.amount}`,
        // No per-row route exists for project_maps anywhere in the app yet
        // (see this file's header comment) — the project's book is the
        // closest real page, not a dead link into a stub.
        url: `/finance/bookkeeping/project/${data.project_id}`,
      };
    }
    // work_request / contract_round / contract / payment_request: their
    // tables were removed, so an old link of that type is just a dead record.
    default:
      return { label: "سجل محذوف", url: null };
  }
}

export function useLinkedRecordInfo(recordType: LinkRecordType, recordId: string) {
  return useQuery({
    queryKey: ["linked-record-info", recordType, recordId],
    queryFn: () => fetchRecordInfo(recordType, recordId),
  });
}

export interface LinkableRecord {
  id: string;
  label: string;
}

async function searchLinkableRecords(recordType: LinkRecordType, projectId: string): Promise<LinkableRecord[]> {
  switch (recordType) {
    case "shop_order": {
      const { data } = await supabase
        .from("shop_orders")
        .select("id, note, vendor_ref, status")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false })
        .limit(30);
      return (data ?? []).map((r) => ({ id: r.id, label: r.vendor_ref || r.note || `طلب #${r.id.slice(0, 8)} — ${r.status}` }));
    }
    case "expense": {
      const { data } = await supabase
        .from("project_expenses")
        .select("id, description, total_amount")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false })
        .limit(30);
      return (data ?? []).map((r) => ({ id: r.id, label: r.description || `مصروف — ${r.total_amount}` }));
    }
    case "project_map": {
      const { data } = await supabase
        .from("project_maps")
        .select("id, description, amount")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false })
        .limit(30);
      return (data ?? []).map((r) => ({ id: r.id, label: r.description || `بند خريطة — ${r.amount}` }));
    }
    default:
      return [];
  }
}

export function useLinkableRecords(recordType: LinkRecordType, projectId: string | null) {
  const query = useQuery({
    queryKey: ["linkable-records", recordType, projectId],
    enabled: !!projectId,
    queryFn: () => searchLinkableRecords(recordType, projectId as string),
  });
  return query.data ?? [];
}
