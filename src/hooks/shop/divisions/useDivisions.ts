import { useEffect, useState } from "react";
import { Divisions } from "../../../types/global.type";
import { PostgrestError } from "@supabase/supabase-js";
import { supabase } from "../../../lib/supabaseClient";
import { ShopDivisionFormValues } from "../../../types/schema/shop/division.schema";

export function useDivisions() {
  const [divisions, setDivisions] = useState<Divisions[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<PostgrestError | null>(null);

  useEffect(() => {
    async function fetchDivisions() {
      setLoading(true);
      setError(null);

      try {
        const { data, error: rolesError } = await supabase
          .from("shop_divisions")
          .select("*");

        if (rolesError) {
          console.error("Error fetching shop divisions:", rolesError);
          setError(rolesError);
          return;
        }

        setDivisions(data || []);
      } catch (err) {
        console.error("Unexpected error fetching shop divisions:", err);
        setError(err as PostgrestError);
      } finally {
        setLoading(false);
      }
    }

    fetchDivisions();
  }, []);

  const addDivision = async (division: ShopDivisionFormValues) => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: insertError } = await supabase
        .from("shop_divisions")
        .insert([division])
        .select()
        .single();

      if (insertError) {
        console.error("Error adding shop division:", insertError);
        setError(insertError);
        return null;
      }

      setDivisions((prev) => [...prev, data]);
      return data;
    } catch (err) {
      console.error("Unexpected error adding shop division:", err);
      setError(err as PostgrestError);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // hooks/shop/divisions/useDivisions.ts
  // ... keep existing fetch logic, add this:

  const toggleDivisionActive = async (id: string, isActive: boolean) => {
    setError(null);

    // optimistic update
    setDivisions((prev) =>
      prev.map((d) => (d.id === id ? { ...d, is_active: isActive } : d)),
    );

    try {
      const { data, error: updateError } = await supabase
        .from("shop_divisions")
        .update({ is_active: isActive })
        .eq("id", id)
        .select()
        .single();

      if (updateError) {
        console.error("Error toggling division status:", updateError);
        setError(updateError);
        // revert on failure
        setDivisions((prev) =>
          prev.map((d) => (d.id === id ? { ...d, is_active: !isActive } : d)),
        );
        return null;
      }

      return data;
    } catch (err) {
      console.error("Unexpected error toggling division status:", err);
      setError(err as PostgrestError);
      setDivisions((prev) =>
        prev.map((d) => (d.id === id ? { ...d, is_active: !isActive } : d)),
      );
      return null;
    }
  };

  return { divisions, loading, error, addDivision, toggleDivisionActive };
}
