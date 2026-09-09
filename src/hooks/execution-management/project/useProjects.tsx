import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../../lib/supabaseClient";
import { Database } from "../../../lib/supabase";

export interface ProjectExecution {
  id: string;
  name: string;
  serial_number: number | null;
  end_date: string | null;
  estimated_due_date: string | null;
  start_date: string | null;
  status: Database["public"]["Enums"]["project_status_enum"];
}

const fetchProjects = async (): Promise<ProjectExecution[]> => {
  const { data, error } = await supabase
    .from("projects")
    .select(
      "id, name, serial_number, end_date, estimated_due_date, start_date, status",
    );
  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error("Project not found");
  }

  return data;
};

export const useProjects = () => {
  return useQuery({
    queryKey: ["project execution"],
    queryFn: () => fetchProjects(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};
