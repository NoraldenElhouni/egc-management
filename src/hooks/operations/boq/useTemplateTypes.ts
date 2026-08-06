import { PostgrestError } from "@supabase/supabase-js";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";
import { computeNextSortOrder } from "./sortOrder";

export interface TemplateType {
  id: string;
  name: string;
  sort_order: number;
  created_at: string;
}

export function useTemplateTypes() {
  const [templateTypes, setTemplateTypes] = useState<TemplateType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<PostgrestError | null>(null);

  const fetchTemplateTypes = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .schema("boq")
        .from("template_types")
        .select("*")
        .order("sort_order", { ascending: true });

      if (error) {
        console.error("error fetching template types", error);
        setError(error);
      } else {
        setTemplateTypes(data ?? []);
      }
    } catch (err) {
      console.error("unexpected error fetching template types", err);
      setError(err as PostgrestError);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchTemplateTypes();
  }, [fetchTemplateTypes]);

  return {
    templateTypes,
    setTemplateTypes,
    loading,
    error,
    refetch: fetchTemplateTypes,
  };
}

export function useCreateTemplateType() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<PostgrestError | null>(null);

  async function createTemplateType(
    values: { name: string },
    siblings: { sort_order: number }[],
  ) {
    setLoading(true);
    setError(null);

    const { data, error } = await supabase
      .schema("boq")
      .from("template_types")
      .insert({
        name: values.name,
        sort_order: computeNextSortOrder(siblings),
      })
      .select("*")
      .single();

    setLoading(false);
    if (error) {
      console.error("error creating template type", error);
      setError(error);
      return { data: null, error };
    }
    return { data, error: null };
  }

  return { createTemplateType, loading, error };
}

export function useUpdateTemplateType() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<PostgrestError | null>(null);

  async function updateTemplateType(
    templateTypeId: string,
    values: { name: string },
  ) {
    setLoading(true);
    setError(null);

    const { error } = await supabase
      .schema("boq")
      .from("template_types")
      .update({ name: values.name })
      .eq("id", templateTypeId);

    setLoading(false);
    if (error) {
      console.error("error updating template type", error);
      setError(error);
      return { error };
    }
    return { error: null };
  }

  return { updateTemplateType, loading, error };
}

export function useDeleteTemplateType() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<PostgrestError | null>(null);

  async function deleteTemplateType(templateTypeId: string) {
    setLoading(true);
    setError(null);

    const { data: works, error: fetchError } = await supabase
      .schema("boq")
      .from("template_works")
      .select("id, template_items ( id )")
      .eq("template_type_id", templateTypeId);

    if (fetchError) {
      setError(fetchError);
      setLoading(false);
      return { error: fetchError };
    }

    const rows = works ?? [];
    const itemIds = rows.flatMap((w) => w.template_items.map((i) => i.id));
    const workIds = rows.map((w) => w.id);

    if (itemIds.length > 0) {
      const { error } = await supabase
        .schema("boq")
        .from("template_items")
        .delete()
        .in("id", itemIds);
      if (error) {
        setError(error);
        setLoading(false);
        return { error };
      }
    }

    if (workIds.length > 0) {
      const { error } = await supabase
        .schema("boq")
        .from("template_works")
        .delete()
        .in("id", workIds);
      if (error) {
        setError(error);
        setLoading(false);
        return { error };
      }
    }

    const { error } = await supabase
      .schema("boq")
      .from("template_types")
      .delete()
      .eq("id", templateTypeId);

    setLoading(false);
    if (error) {
      setError(error);
      return { error };
    }
    return { error: null };
  }

  return { deleteTemplateType, loading, error };
}
