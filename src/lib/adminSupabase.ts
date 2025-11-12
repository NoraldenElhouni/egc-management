// src/lib/supabaseClient.ts
import { createClient } from "@supabase/supabase-js";
import { Database } from "./supabase";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_KEY as
  | string
  | undefined;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error(
    "Missing VITE_SUPABASE_URL or VITE_SUPABASE_SERVICE_KEY. Add them to your .env"
  );
}

export const supabaseAdmin = createClient<Database>(
  supabaseUrl,
  supabaseServiceKey
);
