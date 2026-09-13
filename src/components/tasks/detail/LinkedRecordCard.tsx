import { useQuery } from "@tanstack/react-query";
import { Link as RouterLink } from "react-router-dom";
import { LinkIcon, X } from "lucide-react";
import { supabase } from "../../../lib/supabaseClient";
import { useLinkedRecordInfo, RECORD_TYPE_LABELS } from "../../../hooks/tasks/useLinkedRecord";
import type { TaskLink } from "../../../hooks/tasks/useTaskDetail";

// "The buyer taps شراء الرخام and lands in the actual order" (build plan
// §4.14) — useLinkedRecordInfo resolves each link's real record and its
// route per-type (see that hook's header for which types have a real
// detail page today vs. a closest-available fallback).

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

function LinkedRecordRow({ link, onRemove }: { link: TaskLink; onRemove: (id: string) => void }) {
  const { data: info } = useLinkedRecordInfo(link.record_type, link.record_id);
  const { data: liveStatus } = useLiveStatus(link);
  const { data: coversMultiple } = useCoversMultiple(link);

  const content = (
    <>
      <LinkIcon className="h-3.5 w-3.5 shrink-0 text-blue-500" />
      <span className="flex-1 truncate text-blue-900">
        {RECORD_TYPE_LABELS[link.record_type]}
        {info?.label ? ` — ${info.label}` : ""}
        {link.link_mode === "produces" ? " (تُنتج بهذه المهمة)" : " (مرجع)"}
      </span>
      {liveStatus && (
        <span className="shrink-0 rounded-full bg-white px-2 py-0.5 text-xs text-blue-700">{liveStatus}</span>
      )}
      {coversMultiple && <span className="shrink-0 text-xs text-blue-400">تغطي عدة مهام</span>}
    </>
  );

  return (
    <div className="flex items-center gap-2 rounded-lg border border-blue-100 bg-blue-50 px-2.5 py-2 text-sm">
      {info?.url ? (
        <RouterLink to={info.url} className="flex flex-1 items-center gap-2 overflow-hidden hover:underline">
          {content}
        </RouterLink>
      ) : (
        <div className="flex flex-1 items-center gap-2 overflow-hidden">{content}</div>
      )}
      <button onClick={() => onRemove(link.id)} className="shrink-0 rounded p-0.5 text-blue-300 hover:bg-blue-100 hover:text-blue-600">
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

export default function LinkedRecordCard({
  links,
  onRemove,
}: {
  links: TaskLink[];
  onRemove: (id: string) => void;
}) {
  if (links.length === 0) return null;
  return (
    <div className="space-y-1.5">
      {links.map((link) => (
        <LinkedRecordRow key={link.id} link={link} onRemove={onRemove} />
      ))}
    </div>
  );
}
