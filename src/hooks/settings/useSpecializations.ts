import { useEffect, useState, useCallback } from "react";
import { Services, SpecializationCategories } from "../../types/global.type";
import { PostgrestError } from "@supabase/supabase-js";
import { supabase } from "../../lib/supabaseClient";
import { SpecializationUpdateValues } from "../../types/schema/Specialization.schema";

export interface Category extends SpecializationCategories {
  services: Services[];
}

type PermissionRow = {
  permission_id: string;
  permissions?: { id: string; name: string } | null;
};

type RoleRow = {
  id: string;
  name: string;
  code: string;
  number: number;
};

type SpecializationRow = {
  id: string;
  name: string;
  role_id: string;
  roles?: RoleRow | null;
  specialization_permissions?: PermissionRow[];
};

export function useSpecializations(specializationsId: string) {
  const [categories, setCategories] = useState<SpecializationCategories[]>([]);
  const [services, setServices] = useState<Services[] | null>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<PostgrestError | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [specialization, setSpecialization] =
    useState<SpecializationRow | null>(null);

  // ✅ Extracted into a useCallback so it can be called by the parent as refresh()
  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const { data: spec, error: specializationError } = await supabase
        .from("specializations")
        .select(
          `
          id,
          name,
          role_id,
          roles:role_id ( id, name, code, number ),
          specialization_permissions (
            permission_id,
            permissions:permission_id ( id, name )
          )
        `,
        )
        .eq("id", specializationsId)
        .single();

      if (specializationError) {
        console.error("error fetching specializations", specializationError);
        setError(specializationError);
      } else {
        setSpecialization(spec);
      }

      // ✅ Fetch categories with their nested services
      const { data: category, error: categoryError } = await supabase
        .from("specialization_categories")
        .select("*, services(*)")
        .eq("specialization_id", specializationsId);

      if (categoryError) {
        console.error("error fetching categories", categoryError);
        setError(categoryError);
      } else {
        setCategories(category ?? []);
      }

      // ✅ Fetch ALL services for this specialization (including categorized ones)
      // The detail page will filter to only show uncategorized ones in the standalone list
      const { data: servicesData, error: servError } = await supabase
        .from("services")
        .select("*")
        .eq("specialization_id", specializationsId);

      if (servError) {
        console.error("error fetching services", servError);
        setError(servError);
      } else {
        setServices(servicesData ?? []);
      }
    } catch (err) {
      console.error("unexpected error fetching specializations", err);
      setError(err as PostgrestError);
    }
    setLoading(false);
  }, [specializationsId]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const updateSpecialization = async (data: SpecializationUpdateValues) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("specializations")
        .update({ name: data.name.trim() })
        .eq("id", data.id);

      if (error) throw error;
      setSpecialization((prev) =>
        prev ? { ...prev, name: data.name.trim() } : prev,
      );
    } catch (e: unknown) {
      console.error("Error updating specialization:", e);
      setSubmitError("حدث خطأ أثناء تحديث التخصص. الرجاء المحاولة مرة أخرى.");
    } finally {
      setLoading(false);
    }
  };

  return {
    specialization,
    categories,
    services,
    error,
    loading,
    updateSpecialization,
    submitError,
    refresh: fetchAll, // ✅ exposed so the page can trigger a real re-fetch
  };
}
