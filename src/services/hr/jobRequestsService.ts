import { supabase } from "../../lib/supabaseClient";
import type { JobRequestStatus } from "../../types/hr.type";
import type { JobRequestFormValues } from "../../types/schema/jobRequest.schema";

const hrDb = () => supabase.schema("hr");

const normalize = (v?: string | null) => {
  if (v === undefined || v === null) return null;
  const t = v.trim();
  return t === "" ? null : t;
};

export const createJobRequest = async (
  data: JobRequestFormValues,
  requestedByEmployeeId: string | null,
) => {
  const { data: jobRequest, error } = await hrDb()
    .from("job_requests")
    .insert({
      position_title: data.positionTitle.trim(),
      department: normalize(data.department),
      positions_count: data.positionsCount ?? 1,
      justification: normalize(data.justification),
      requested_by_employee_id: requestedByEmployeeId,
    })
    .select()
    .single();

  if (error || !jobRequest) {
    console.error("Error creating job request:", error);
    return {
      success: false,
      error,
      message: "فشل في إنشاء طلب التوظيف",
    };
  }

  return {
    success: true,
    data: jobRequest,
    message: "تم إنشاء طلب التوظيف بنجاح",
  };
};

export const listJobRequests = async () => {
  return hrDb()
    .from("job_requests")
    .select("*")
    .order("created_at", { ascending: false });
};

export const listOpenJobRequests = async () => {
  return hrDb()
    .from("job_requests")
    .select("*")
    .eq("status", "open")
    .order("created_at", { ascending: false });
};

export const getJobRequest = async (id: string) => {
  return hrDb().from("job_requests").select("*").eq("id", id).single();
};

export const updateJobRequestStatus = async (
  id: string,
  status: JobRequestStatus,
) => {
  return hrDb().from("job_requests").update({ status }).eq("id", id);
};
