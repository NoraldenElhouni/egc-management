import { supabase } from "../../lib/supabaseClient";

export async function getProfile() {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData?.user) {
    console.error("Error fetching user:", userError);
    return null;
  }

  const { data: profileData, error: profileError } = await supabase
    .from("employees")
    .select("first_name, last_name")
    .eq("id", userData.user.id)
    .single();

  if (profileError) {
    console.error("Error fetching profile:", profileError);
    return null;
  }

  const { data: roleData, error: roleError } = await supabase
    .from("user_roles")
    .select("roles(name)")
    .eq("user_id", userData.user.id)
    .single();

  if (roleError) {
    console.error("Error fetching role:", roleError);
    return null;
  }

  return {
    name: `${profileData?.first_name || ""} ${profileData?.last_name || ""}`.trim(),
    role: roleData?.roles?.name || "Unknown",
  };
}
