import { supabase } from "../../lib/supabaseClient";

/** Resolves a list of employee ids to "first last" display names. */
export const resolveEmployeeNames = async (
  employeeIds: (string | null)[],
): Promise<Map<string, string>> => {
  const ids = Array.from(
    new Set(employeeIds.filter((id): id is string => Boolean(id))),
  );
  if (ids.length === 0) return new Map();

  const { data, error } = await supabase
    .from("employees")
    .select("id, first_name, last_name")
    .in("id", ids);

  if (error || !data) {
    console.error("Error resolving employee names:", error);
    return new Map();
  }

  return new Map(
    data.map((e) => [e.id, `${e.first_name} ${e.last_name ?? ""}`.trim()]),
  );
};
