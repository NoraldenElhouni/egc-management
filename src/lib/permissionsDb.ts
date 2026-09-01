// =====================================================================
// A separately-typed view of the SAME Supabase connection
// =====================================================================
//
// This is not a second client. It is the one client from
// supabaseClient.ts, re-typed so the Phase 1 tables and Phase 2
// functions are visible to TypeScript. Same session, same auth, same
// connection pool — casting only changes what the compiler believes.
//
// See src/types/permissions.types.ts for why this is needed and when
// it should be deleted (short version: after `npm run types` is re-run
// now that Phase 1 has landed).
//
// Do NOT reach for this client for anything outside the permission
// admin screens. Everything else already has proper generated types.
// =====================================================================

import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "./supabaseClient";
import type { PermissionsDatabase } from "../types/permissions.types";

export const permissionsDb =
  supabase as unknown as SupabaseClient<PermissionsDatabase>;
