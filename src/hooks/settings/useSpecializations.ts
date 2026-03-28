import { useEffect, useState } from "react";
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

  useEffect(() => {
    async function fetchRoles() {
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

        const { data: category, error: categoryError } = await supabase
          .from("specialization_categories")
          .select("*, services(*)")
          .eq("specialization_id", specializationsId);

        if (categoryError) {
          console.error("error fetching specializations", categoryError);
          setError(categoryError);
        } else {
          setCategories(category ?? []);
        }

        const { data: services, error: servError } = await supabase
          .from("services")
          .select("*")
          .eq("specialization_id", specializationsId);

        if (servError) {
          console.error("error fetching specializations", error);
          setError(servError);
        } else {
          setServices(services ?? []);
        }
      } catch (err) {
        console.error("unexpected error fetching specializations", err);
        setError(err as PostgrestError);
      }
      setLoading(false);
    }
    fetchRoles();
  }, []);

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

  const addService = async (
    specializationId: string,
    name: string,
    unit: string,
  ) => {
    console.log("Adding service:", { specializationId, name, unit });
    setLoading(true);
    setSubmitError(null);
  };

  return {
    specialization,
    categories,
    services,
    error,
    loading,
    updateSpecialization,
    submitError,
    addService,
  };
}
