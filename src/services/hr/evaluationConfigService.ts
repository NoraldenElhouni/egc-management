import { supabase } from "../../lib/supabaseClient";
import type { EvaluationCategory } from "../../types/hr.type";

const hrDb = () => supabase.schema("hr");

// ── evaluation_criteria ──────────────────────────────────────────────

export const getCriteria = async (
  category: EvaluationCategory,
  { activeOnly = true }: { activeOnly?: boolean } = {},
) => {
  let query = hrDb()
    .from("evaluation_criteria")
    .select("*")
    .eq("category", category)
    .order("sort_order", { ascending: true });
  if (activeOnly) query = query.eq("is_active", true);
  return query;
};

export const addCriterion = async (
  category: EvaluationCategory,
  nameAr: string,
  nextSortOrder: number,
) => {
  return hrDb()
    .from("evaluation_criteria")
    .insert({ category, name_ar: nameAr.trim(), sort_order: nextSortOrder })
    .select()
    .single();
};

export const updateCriterion = async (
  id: string,
  fields: { name_ar?: string; description?: string | null },
) => {
  return hrDb().from("evaluation_criteria").update(fields).eq("id", id);
};

export const setCriterionActive = async (id: string, isActive: boolean) => {
  return hrDb()
    .from("evaluation_criteria")
    .update({ is_active: isActive })
    .eq("id", id);
};

export const reorderCriteria = async (
  rows: { id: string; sort_order: number }[],
) => {
  return hrDb()
    .from("evaluation_criteria")
    .upsert(
      rows.map((r) => ({ id: r.id, sort_order: r.sort_order })),
      { onConflict: "id" },
    );
};

// ── rating_scale ─────────────────────────────────────────────────────

export const getRatingScale = async (
  category: EvaluationCategory,
  { activeOnly = true }: { activeOnly?: boolean } = {},
) => {
  let query = hrDb()
    .from("rating_scale")
    .select("*")
    .eq("category", category)
    .order("sort_order", { ascending: true });
  if (activeOnly) query = query.eq("is_active", true);
  return query;
};

export const addRatingLevel = async (
  category: EvaluationCategory,
  labelAr: string,
  score: number,
  nextSortOrder: number,
) => {
  return hrDb()
    .from("rating_scale")
    .insert({
      category,
      label_ar: labelAr.trim(),
      score,
      sort_order: nextSortOrder,
    })
    .select()
    .single();
};

export const updateRatingLevel = async (
  id: string,
  fields: { label_ar?: string; score?: number },
) => {
  return hrDb().from("rating_scale").update(fields).eq("id", id);
};

export const setRatingLevelActive = async (id: string, isActive: boolean) => {
  return hrDb()
    .from("rating_scale")
    .update({ is_active: isActive })
    .eq("id", id);
};

export const reorderRatingScale = async (
  rows: { id: string; sort_order: number }[],
) => {
  return hrDb()
    .from("rating_scale")
    .upsert(
      rows.map((r) => ({ id: r.id, sort_order: r.sort_order })),
      { onConflict: "id" },
    );
};
