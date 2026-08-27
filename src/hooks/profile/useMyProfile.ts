import { useCallback, useEffect, useState } from "react";
import { PostgrestError } from "@supabase/supabase-js";
import { supabase } from "../../lib/supabaseClient";

export interface MyProfile {
  id: string;
  first_name: string;
  last_name: string | null;
  email: string;
  phone: string | null;
  dob: string | null;
  status: "active" | "inactive" | "on leave" | "on holiday";
}

export type MyProfileUpdate = Partial<
  Pick<MyProfile, "first_name" | "last_name" | "phone" | "dob">
>;

export function useMyProfile(userId: string | undefined) {
  const [profile, setProfile] = useState<MyProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<PostgrestError | null>(null);

  const fetchProfile = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from("users")
        .select("id, first_name, last_name, email, phone, dob, status")
        .eq("id", userId)
        .single();

      if (fetchError) throw fetchError;
      setProfile(data);
    } catch (err) {
      console.error("Error fetching profile:", err);
      setError(err as PostgrestError);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const updateProfile = useCallback(
    async (updates: MyProfileUpdate) => {
      if (!userId) return { error: new Error("لا يوجد مستخدم") };

      const { error: updateError } = await supabase
        .from("users")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", userId);

      if (updateError) {
        console.error("Error updating profile:", updateError);
        return { error: updateError };
      }

      await fetchProfile();
      return { error: null };
    },
    [userId, fetchProfile],
  );

  return { profile, loading, error, refetch: fetchProfile, updateProfile };
}
