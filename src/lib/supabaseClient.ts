// src/lib/supabaseClient.ts
import { createClient } from "@supabase/supabase-js";
import { Database } from "./supabase";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as
  | string
  | undefined;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. Add them to your .env"
  );
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
