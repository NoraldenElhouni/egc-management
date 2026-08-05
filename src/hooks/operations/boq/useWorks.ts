import { PostgrestError } from "@supabase/supabase-js";
import { useState } from "react";
import { supabase } from "../../../lib/supabaseClient";
import { WorkFull } from "./types";

export interface Work {
  id: string;
  article_id: string;
  name: string;
  sort_order: number;
  created_at: string;
}

export function useCreateWork() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<PostgrestError | null>(null);

  async function createWork(
    articleId: string,
    values: { name: string },
    siblings: { sort_order: number }[],
  ) {
    setLoading(true);
    setError(null);

    const nextSortOrder =
      Math.max(0, ...siblings.map((s) => s.sort_order)) + 1;

    const { data, error } = await supabase
      .schema("boq")
      .from("works")
      .insert({
        article_id: articleId,
        name: values.name,
        sort_order: nextSortOrder,
      })
      .select("*")
      .single();

    setLoading(false);
    if (error) {
      console.error("error creating work", error);
      setError(error);
      return { data: null, error };
    }
    return { data, error: null };
  }

  return { createWork, loading, error };
}

export function useUpdateWork() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<PostgrestError | null>(null);

  async function updateWork(workId: string, values: { name: string }) {
    setLoading(true);
    setError(null);

    const { error } = await supabase
      .schema("boq")
      .from("works")
      .update({ name: values.name })
      .eq("id", workId);

    setLoading(false);
    if (error) {
      console.error("error updating work", error);
      setError(error);
      return { error };
    }
    return { error: null };
  }

  return { updateWork, loading, error };
}

export function useDeleteWork() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<PostgrestError | null>(null);

  async function deleteWork(work: WorkFull) {
    setLoading(true);
    setError(null);

    const itemIds = work.items.map((i) => i.id);

    if (itemIds.length > 0) {
      const { error } = await supabase
        .schema("boq")
        .from("items")
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
      .from("works")
      .delete()
      .eq("id", work.id);

    setLoading(false);
    if (error) {
      setError(error);
      return { error };
    }
    return { error: null };
  }

  return { deleteWork, loading, error };
}
