// src/renderer/services/auth.ts (example file)

import { supabase } from "./supabaseClient";

// Function to sign up a new user with email and password
export const signUpUser = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    // Optional: add data or a redirect URL here if needed
  });

  if (error) throw error;
  return data;
};

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
