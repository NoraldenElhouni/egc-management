import { PostgrestError } from "@supabase/supabase-js";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";
import { TemplateItemRow, TemplateWorkFull } from "./types";
import { computeNextSortOrder } from "./sortOrder";

type TemplateWorkRow = {
  id: string;
  template_type_id: string;
  name: string;
  sort_order: number;
  template_items: TemplateItemRow[];
};

export function useTemplateTypeWorks(templateTypeId: string) {
  const [works, setWorks] = useState<TemplateWorkFull[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<PostgrestError | null>(null);

  const fetchWorks = useCallback(async () => {
    if (!templateTypeId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .schema("boq")
        .from("template_works")
        .select(
          `id, template_type_id, name, sort_order,
          template_items ( id, name, unit, default_quantity, default_unit_price, sort_order )`,
        )
        .eq("template_type_id", templateTypeId)
        .order("sort_order", { ascending: true })
        .order("sort_order", {
          ascending: true,
          referencedTable: "template_items",
        });

      if (error) {
        console.error("error fetching template works", error);
        setError(error);
      } else {
        const rows = (data ?? []) as unknown as TemplateWorkRow[];
        setWorks(
          rows.map((w) => ({
            id: w.id,
            template_type_id: w.template_type_id,
            name: w.name,
            sort_order: w.sort_order,
            items: w.template_items,
          })),
        );
      }
    } catch (err) {
      console.error("unexpected error fetching template works", err);
      setError(err as PostgrestError);
    }
    setLoading(false);
  }, [templateTypeId]);

  useEffect(() => {
    fetchWorks();
  }, [fetchWorks]);

  return { works, setWorks, loading, error, refetch: fetchWorks };
}

export function useCreateTemplateWork() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<PostgrestError | null>(null);

  async function createTemplateWork(
    templateTypeId: string,
    values: { name: string },
    siblings: { sort_order: number }[],
  ) {
    setLoading(true);
    setError(null);

    const { data, error } = await supabase
      .schema("boq")
      .from("template_works")
      .insert({
        template_type_id: templateTypeId,
        name: values.name,
        sort_order: computeNextSortOrder(siblings),
      })
      .select("*")
      .single();

    setLoading(false);
    if (error) {
      console.error("error creating template work", error);
      setError(error);
      return { data: null, error };
    }
    return { data, error: null };
  }

  return { createTemplateWork, loading, error };
}

export function useUpdateTemplateWork() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<PostgrestError | null>(null);

  async function updateTemplateWork(
    templateWorkId: string,
    values: { name: string },
  ) {
    setLoading(true);
    setError(null);

    const { error } = await supabase
      .schema("boq")
      .from("template_works")
      .update({ name: values.name })
      .eq("id", templateWorkId);

    setLoading(false);
    if (error) {
      console.error("error updating template work", error);
      setError(error);
      return { error };
    }
    return { error: null };
  }

  return { updateTemplateWork, loading, error };
}

export function useDeleteTemplateWork() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<PostgrestError | null>(null);

  async function deleteTemplateWork(work: TemplateWorkFull) {
    setLoading(true);
    setError(null);

    const itemIds = work.items.map((i) => i.id);

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

    const { error } = await supabase
      .schema("boq")
      .from("template_works")
      .delete()
      .eq("id", work.id);

    setLoading(false);
    if (error) {
      setError(error);
      return { error };
    }
    return { error: null };
  }

  return { deleteTemplateWork, loading, error };
}
