import { useQuery } from "@tanstack/react-query";
import { LinkIcon } from "lucide-react";
import { supabase } from "../../../lib/supabaseClient";
import type { Database } from "../../../lib/supabase";
import type { TaskLink } from "../../../hooks/tasks/useTaskDetail";

type RecordType = Database["tasks"]["Enums"]["link_record_type"];

const RECORD_TYPE_LABELS: Record<RecordType, string> = {
  shop_order: "طلب شراء",
  work_request: "طلب عمل",
  contract_round: "جولة عقد",
  contract: "عقد",
  payment_request: "طلب دفعة",
  expense: "مصروف",
  project_map: "خريطة المشروع",
};

// "The record closes the task. When shop_orders.status becomes arrived, a
// trigger closes every task linked to it" (build plan §5.5 recipe 2) —
// that recipe is the ONLY record type actually wired up so far (per
// tasks-module-db-summary.md's own known-issues list), so a live status
// badge is only fetched for shop_order; other types show the link with no
// live status rather than pretending one exists.
function useLiveStatus(link: TaskLink) {
  return useQuery({
    queryKey: ["task-link-status", link.id],
    queryFn: async () => {
      if (link.record_type !== "shop_order") return null;
      const { data } = await supabase
        .from("shop_orders")
        .select("status")
        .eq("id", link.record_id)
        .maybeSingle();
      return data?.status ?? null;
    },
  });
}

function useCoversMultiple(link: TaskLink) {
  return useQuery({
    queryKey: ["task-link-fanout", link.record_type, link.record_id],
    queryFn: async () => {
      const { count } = await supabase
        .schema("tasks")
        .from("task_links")
        .select("id", { count: "exact", head: true })
        .eq("record_type", link.record_type)
        .eq("record_id", link.record_id);
      return (count ?? 1) > 1;
    },
  });
}

function LinkedRecordRow({ link }: { link: TaskLink }) {
  const { data: liveStatus } = useLiveStatus(link);
  const { data: coversMultiple } = useCoversMultiple(link);

  return (
    <div className="flex items-center gap-2 rounded-lg border border-blue-100 bg-blue-50 px-2.5 py-2 text-sm">
      <LinkIcon className="h-3.5 w-3.5 shrink-0 text-blue-500" />
      <span className="flex-1 truncate text-blue-900">
        {RECORD_TYPE_LABELS[link.record_type]}
        {link.link_mode === "produces" ? " (تُنتج بهذه المهمة)" : " (مرجع)"}
      </span>
      {liveStatus && (
        <span className="shrink-0 rounded-full bg-white px-2 py-0.5 text-xs text-blue-700">
          {liveStatus}
        </span>
      )}
      {coversMultiple && (
        <span className="shrink-0 text-xs text-blue-400">تغطي عدة مهام</span>
      )}
    </div>
  );
}

export default function LinkedRecordCard({ links }: { links: TaskLink[] }) {
  if (links.length === 0) return null;
  return (
    <div className="space-y-1.5">
      {links.map((link) => (
        <LinkedRecordRow key={link.id} link={link} />
      ))}
    </div>
  );
}
