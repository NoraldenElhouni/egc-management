import { supabase } from "../../lib/supabaseClient";

const hrDb = () => supabase.schema("hr");

// ── university tiers ─────────────────────────────────────────────────

export const listUniversityTiers = async () =>
  hrDb().from("university_tiers").select("*").order("sort_order");

export const createUniversityTier = async (
  tierName: string,
  score: number,
  sortOrder: number,
) =>
  hrDb()
    .from("university_tiers")
    .insert({ tier_name: tierName.trim(), score, sort_order: sortOrder });

export const updateUniversityTier = async (
  id: string,
  fields: { tier_name?: string; score?: number },
) => hrDb().from("university_tiers").update(fields).eq("id", id);

// ── universities ─────────────────────────────────────────────────────

export const listUniversities = async () =>
  hrDb().from("universities").select("*").order("sort_order").order("name");

export const createUniversity = async (name: string, tierId: string | null) =>
  hrDb().from("universities").insert({ name: name.trim(), tier_id: tierId });

export const updateUniversity = async (
  id: string,
  fields: { name?: string; tier_id?: string | null },
) => hrDb().from("universities").update(fields).eq("id", id);

export const deleteUniversity = async (id: string) =>
  hrDb().from("universities").delete().eq("id", id);

// ── GPA tiers ────────────────────────────────────────────────────────

export const listGpaTiers = async () =>
  hrDb().from("gpa_tiers").select("*").order("sort_order");

export const createGpaTier = async (
  label: string,
  score: number,
  sortOrder: number,
) =>
  hrDb()
    .from("gpa_tiers")
    .insert({ label: label.trim(), score, sort_order: sortOrder });

export const updateGpaTier = async (
  id: string,
  fields: { label?: string; score?: number },
) => hrDb().from("gpa_tiers").update(fields).eq("id", id);

// ── experience level scores (fixed levels, editable scores) ──────────

export const listExperienceLevelScores = async () =>
  hrDb().from("experience_level_scores").select("*");

export const updateExperienceLevelScore = async (
  level: string,
  score: number,
) =>
  hrDb().from("experience_level_scores").update({ score }).eq("level", level);
