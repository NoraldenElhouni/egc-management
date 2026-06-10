// hooks/operations/contracts/useMilestone.ts
import { useState, useEffect } from "react";
import { PostgrestError } from "@supabase/supabase-js";
import { supabase } from "../../../lib/supabaseClient";
import { MilestoneReportsWithEmployee } from "../../../types/extended.type";

export interface MilestoneReport {
  id: string;
  milestone_id: string;
  contract_id: string;
  description: string | null;
  img_path: string | null;
  amount_done: number | null;
  created_at: string;
  employees: {
    first_name: string;
    last_name: string | null;
  };
}

export interface MilestoneDetail {
  id: string;
  contract_id: string;
  title: string;
  description: string | null;
  amount: number;
  due_date: string | null;
  status: "pending" | "in_progress" | "approved" | "completed";
  order_index: number;
  completed_at: string | null;
  created_at: string;
  contracts: {
    id: string;
    total_amount: number;
    project_id: string;
    projects: { name: string };
    contractors: { first_name: string; last_name: string | null };
    work_requests: { title: string };
  };
  milestone_reports: MilestoneReportsWithEmployee[];
}

export function useMilestone(milestoneId: string) {
  const [milestone, setMilestone] = useState<MilestoneDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<PostgrestError | null>(null);

  useEffect(() => {
    if (!milestoneId) return;
    async function fetch() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("contract_milestones")
          .select(
            `*,
            contracts(
              id, total_amount, project_id,
              projects(name),
              contractors(first_name, last_name),
              work_requests(title)
            ),
            milestone_reports(
              *,
              employees!milestone_reports_submitted_by_fkey(id, first_name, last_name)
            )`,
          )
          .eq("id", milestoneId)
          .single();

        if (error) setError(error);
        else setMilestone(data);
      } catch (err) {
        setError(err as PostgrestError);
      }
      setLoading(false);
    }
    fetch();
  }, [milestoneId]);

  return { milestone, loading, error };
}
