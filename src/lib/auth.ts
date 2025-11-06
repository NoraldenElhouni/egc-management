import { supabase } from "./supabaseClient";

// Function to sign in an existing user with email and password
export const signInUser = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  return data;
};

// Function to sign out the current user
export const signOutUser = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};
