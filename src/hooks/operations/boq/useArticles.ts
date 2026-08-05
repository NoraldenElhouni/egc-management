import { PostgrestError } from "@supabase/supabase-js";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../../useAuth";
import { supabase } from "../../../lib/supabaseClient";
import { ArticleFull } from "./types";

export interface Article {
  id: string;
  project_id: string;
  type_id: string;
  name: string;
  sort_order: number;
  created_at: string;
  created_by: string;
}

export function useTypeArticles(typeId: string) {
  const [articles, setArticles] = useState<ArticleFull[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<PostgrestError | null>(null);

  const fetchArticles = useCallback(async () => {
    if (!typeId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .schema("boq")
        .from("articles")
        .select(
          `id, name, sort_order,
          works ( id, name, sort_order,
            items ( id, name, unit, quantity, unit_price, zone_id, sort_order )
          )`,
        )
        .eq("type_id", typeId)
        .order("sort_order", { ascending: true });

      if (error) {
        console.error("error fetching articles", error);
        setError(error);
      } else {
        setArticles((data ?? []) as unknown as ArticleFull[]);
      }
    } catch (err) {
      console.error("unexpected error fetching articles", err);
      setError(err as PostgrestError);
    }
    setLoading(false);
  }, [typeId]);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  return { articles, loading, error, refetch: fetchArticles };
}

export function useCreateArticle() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<PostgrestError | null>(null);
  const { user } = useAuth();

  async function createArticle(
    projectId: string,
    typeId: string,
    values: { name: string },
    siblings: { sort_order: number }[],
  ) {
    setLoading(true);
    setError(null);

    const nextSortOrder =
      Math.max(0, ...siblings.map((s) => s.sort_order)) + 1;

    const { data, error } = await supabase
      .schema("boq")
      .from("articles")
      .insert({
        project_id: projectId,
        type_id: typeId,
        name: values.name,
        sort_order: nextSortOrder,
        created_by: user?.id ?? "",
      })
      .select("*")
      .single();

    setLoading(false);
    if (error) {
      console.error("error creating article", error);
      setError(error);
      return { data: null, error };
    }
    return { data, error: null };
  }

  return { createArticle, loading, error };
}

export function useUpdateArticle() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<PostgrestError | null>(null);

  async function updateArticle(articleId: string, values: { name: string }) {
    setLoading(true);
    setError(null);

    const { error } = await supabase
      .schema("boq")
      .from("articles")
      .update({ name: values.name })
      .eq("id", articleId);

    setLoading(false);
    if (error) {
      console.error("error updating article", error);
      setError(error);
      return { error };
    }
    return { error: null };
  }

  return { updateArticle, loading, error };
}

export function useDeleteArticle() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<PostgrestError | null>(null);

  async function deleteArticle(article: ArticleFull) {
    setLoading(true);
    setError(null);

    const workIds = article.works.map((w) => w.id);
    const itemIds = article.works.flatMap((w) => w.items.map((i) => i.id));

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

    if (workIds.length > 0) {
      const { error } = await supabase
        .schema("boq")
        .from("works")
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
      .from("articles")
      .delete()
      .eq("id", article.id);

    setLoading(false);
    if (error) {
      setError(error);
      return { error };
    }
    return { error: null };
  }

  return { deleteArticle, loading, error };
}
