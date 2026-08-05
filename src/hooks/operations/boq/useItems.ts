import { PostgrestError } from "@supabase/supabase-js";
import { useState } from "react";
import { useAuth } from "../../useAuth";
import { supabase } from "../../../lib/supabaseClient";

export interface Item {
  id: string;
  work_id: string;
  name: string;
  unit: string;
  quantity: number;
  unit_price: number | null;
  sort_order: number;
  created_at: string;
  created_by: string;
}

export interface ItemFormValues {
  name: string;
  unit: string;
  quantity: number;
  unit_price: number | null;
}

export function useCreateItem() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<PostgrestError | null>(null);
  const { user } = useAuth();

  async function createItem(
    workId: string,
    values: ItemFormValues,
    siblings: { sort_order: number }[],
  ) {
    setLoading(true);
    setError(null);

    const nextSortOrder =
      Math.max(0, ...siblings.map((s) => s.sort_order)) + 1;

    const { data, error } = await supabase
      .schema("boq")
      .from("items")
      .insert({
        work_id: workId,
        name: values.name,
        unit: values.unit,
        quantity: values.quantity,
        unit_price: values.unit_price,
        sort_order: nextSortOrder,
        created_by: user?.id ?? "",
      })
      .select("*")
      .single();

    setLoading(false);
    if (error) {
      console.error("error creating item", error);
      setError(error);
      return { data: null, error };
    }
    return { data, error: null };
  }

  return { createItem, loading, error };
}

export function useUpdateItem() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<PostgrestError | null>(null);

  async function updateItem(itemId: string, values: ItemFormValues) {
    setLoading(true);
    setError(null);

    const { error } = await supabase
      .schema("boq")
      .from("items")
      .update({
        name: values.name,
        unit: values.unit,
        quantity: values.quantity,
        unit_price: values.unit_price,
      })
      .eq("id", itemId);

    setLoading(false);
    if (error) {
      console.error("error updating item", error);
      setError(error);
      return { error };
    }
    return { error: null };
  }

  return { updateItem, loading, error };
}

export function useDeleteItem() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<PostgrestError | null>(null);

  async function deleteItem(itemId: string) {
    setLoading(true);
    setError(null);

    const { error } = await supabase
      .schema("boq")
      .from("items")
      .delete()
      .eq("id", itemId);

    setLoading(false);
    if (error) {
      setError(error);
      return { error };
    }
    return { error: null };
  }

  return { deleteItem, loading, error };
}
