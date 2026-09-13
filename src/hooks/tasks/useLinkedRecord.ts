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
    case "work_request": {
      const { data } = await supabase
        .from("work_requests")
        .select("id, project_id, title")
        .eq("id", recordId)
        .maybeSingle();
      if (!data) return { label: "طلب عمل محذوف", url: null };
      return { label: data.title, url: `/projects/${data.project_id}` };
    }
    case "contract_round": {
      const { data } = await supabase
        .schema("contracts")
        .from("rounds")
        .select("id, project_id, title")
        .eq("id", recordId)
        .maybeSingle();
      if (!data) return { label: "جولة عقد محذوفة", url: null };
      return { label: data.title, url: `/operations/contracts/project/${data.project_id}/rounds/${data.id}` };
    }
    case "contract": {
      const { data } = await supabase
        .schema("contracts")
        .from("contracts")
        .select("id, project_id, round_id, total_amount")
        .eq("id", recordId)
        .maybeSingle();
      if (!data) return { label: "عقد محذوف", url: null };
      const { data: round } = await supabase.schema("contracts").from("rounds").select("title").eq("id", data.round_id).maybeSingle();
      return {
        label: round?.title ? `عقد — ${round.title}` : `عقد — ${data.total_amount}`,
        url: `/operations/contracts/project/${data.project_id}/${data.id}`,
      };
    }
    case "payment_request": {
      const { data } = await supabase
        .schema("contracts")
        .from("request_payments")
        .select("id, project_id, contract_id, amount, description")
        .eq("id", recordId)
        .maybeSingle();
      if (!data) return { label: "طلب دفعة محذوف", url: null };
      return {
        label: data.description || `طلب دفعة — ${data.amount}`,
        url: `/operations/contracts/project/${data.project_id}/${data.contract_id}/payments`,
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
    case "work_request": {
      const { data } = await supabase
        .from("work_requests")
        .select("id, title")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false })
        .limit(30);
      return (data ?? []).map((r) => ({ id: r.id, label: r.title }));
    }
    case "contract_round": {
      const { data } = await supabase
        .schema("contracts")
        .from("rounds")
        .select("id, title")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false })
        .limit(30);
      return (data ?? []).map((r) => ({ id: r.id, label: r.title }));
    }
    case "contract": {
      const { data } = await supabase
        .schema("contracts")
        .from("contracts")
        .select("id, round_id, total_amount")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false })
        .limit(30);
      if (!data?.length) return [];
      const roundIds = Array.from(new Set(data.map((c) => c.round_id)));
      const { data: rounds } = await supabase.schema("contracts").from("rounds").select("id, title").in("id", roundIds);
      const titleById = new Map((rounds ?? []).map((r) => [r.id, r.title]));
      return data.map((c) => ({ id: c.id, label: `${titleById.get(c.round_id) ?? "عقد"} — ${c.total_amount}` }));
    }
    case "payment_request": {
      const { data } = await supabase
        .schema("contracts")
        .from("request_payments")
        .select("id, description, amount")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false })
        .limit(30);
      return (data ?? []).map((r) => ({ id: r.id, label: r.description || `طلب دفعة — ${r.amount}` }));
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
