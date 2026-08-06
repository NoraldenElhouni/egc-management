import { PostgrestError } from "@supabase/supabase-js";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";
import { TemplateItemRow } from "./types";
import { computeNextSortOrder } from "./sortOrder";

export interface TemplateItemFormValues {
  name: string;
  unit: string;
  default_quantity: number;
  default_unit_price: number | null;
}

/**
 * List-by-work query for template items, standalone (not nested through a
 * template type's works), for UIs that only have a template_work_id in
 * scope — e.g. an item dialog offering "create from template".
 */
export function useTemplateWorkItems(templateWorkId: string) {
  const [items, setItems] = useState<TemplateItemRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<PostgrestError | null>(null);

  const fetchItems = useCallback(async () => {
    if (!templateWorkId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .schema("boq")
        .from("template_items")
        .select("id, name, unit, default_quantity, default_unit_price, sort_order")
        .eq("template_work_id", templateWorkId)
        .order("sort_order", { ascending: true });

      if (error) {
        console.error("error fetching template work items", error);
        setError(error);
      } else {
        setItems(data ?? []);
      }
    } catch (err) {
      console.error("unexpected error fetching template work items", err);
      setError(err as PostgrestError);
    }
    setLoading(false);
  }, [templateWorkId]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  return { items, loading, error, refetch: fetchItems };
}

export function useCreateTemplateItem() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<PostgrestError | null>(null);

  async function createTemplateItem(
    templateWorkId: string,
    values: TemplateItemFormValues,
    siblings: { sort_order: number }[],
  ) {
    setLoading(true);
    setError(null);

    const { data, error } = await supabase
      .schema("boq")
      .from("template_items")
      .insert({
        template_work_id: templateWorkId,
        name: values.name,
        unit: values.unit,
        default_quantity: values.default_quantity,
        default_unit_price: values.default_unit_price,
        sort_order: computeNextSortOrder(siblings),
      })
      .select("*")
      .single();

    setLoading(false);
    if (error) {
      console.error("error creating template item", error);
      setError(error);
      return { data: null, error };
    }
    return { data, error: null };
  }

  return { createTemplateItem, loading, error };
}

export function useUpdateTemplateItem() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<PostgrestError | null>(null);

  async function updateTemplateItem(
    templateItemId: string,
    values: TemplateItemFormValues,
  ) {
    setLoading(true);
    setError(null);

    const { error } = await supabase
      .schema("boq")
      .from("template_items")
      .update({
        name: values.name,
        unit: values.unit,
        default_quantity: values.default_quantity,
        default_unit_price: values.default_unit_price,
      })
      .eq("id", templateItemId);

    setLoading(false);
    if (error) {
      console.error("error updating template item", error);
      setError(error);
      return { error };
    }
    return { error: null };
  }

  return { updateTemplateItem, loading, error };
}

export function useDeleteTemplateItem() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<PostgrestError | null>(null);

  async function deleteTemplateItem(templateItemId: string) {
    setLoading(true);
    setError(null);

    const { error } = await supabase
      .schema("boq")
      .from("template_items")
      .delete()
      .eq("id", templateItemId);

    setLoading(false);
    if (error) {
      setError(error);
      return { error };
    }
    return { error: null };
  }

  return { deleteTemplateItem, loading, error };
}
