// A separately-typed view of the SAME Supabase connection, for the
// agreements / penalties functions and tables in the `contracts` schema
// that the generated types don't know yet. Not a second client — same
// session, same auth. Call sites still select the schema:
// .schema("contracts"). Delete once `npm run types` has been re-run.

import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "./supabaseClient";
import type { AgreementsDatabase } from "../types/agreements.types";

export const agreementsDb =
  supabase as unknown as SupabaseClient<AgreementsDatabase>;
