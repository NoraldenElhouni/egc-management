import { PostgrestError } from "@supabase/supabase-js";
import { useState } from "react";
import { useAuth } from "../../useAuth";
import { supabase } from "../../../lib/supabaseClient";

export function useCreateTypeFromTemplate() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<PostgrestError | null>(null);
  const { user } = useAuth();

  async function createTypeFromTemplate(params: {
    projectId: string;
    templateTypeId: string;
    version: number;
    useTemplate: boolean;
    zoneIds: string[];
    templateWorkIds?: string[] | null;
    templateItemIds?: string[] | null;
  }) {
    setLoading(true);
    setError(null);

    const { data, error } = await supabase
      .schema("boq")
      .rpc("create_type_from_template", {
        p_project_id: params.projectId,
        p_template_type_id: params.templateTypeId,
        p_version: params.version,
        p_use_template: params.useTemplate,
        p_zone_ids: params.zoneIds,
        p_created_by: user?.id ?? "",
        p_template_work_ids: params.templateWorkIds ?? null,
        p_template_item_ids: params.templateItemIds ?? null,
      });

    setLoading(false);
    if (error) {
      setError(error);
      return { data: null, error };
    }
    return { data, error: null };
  }

  return { createTypeFromTemplate, loading, error };
}
