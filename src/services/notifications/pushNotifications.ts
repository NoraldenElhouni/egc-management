import { supabase } from "../../lib/supabaseClient";

// =====================================================================
// Push notifications via the deployed "send-push" Supabase Edge
// Function (Deno, forwards to Expo's push API — see its source under
// the linked project's Edge Functions). Routed through the function
// rather than hitting Expo's API directly from this client, unlike
// Fields' services/Notification/Notification.ts (its own, older,
// direct-to-Expo helper) — keeps the push call server-side, in one
// place shared by both apps.
// =====================================================================

/** Sends a push notification to every device token on file for the given
 *  users. Silently no-ops (logs, doesn't throw) if nobody has a token or
 *  the function call fails — a missed push shouldn't fail the mutation
 *  that triggered it. */
export async function notifyUsers(
  userIds: string[],
  title: string,
  body: string,
  data?: Record<string, unknown>,
): Promise<void> {
  if (userIds.length === 0) return;

  const { data: tokenRows, error: tokensError } = await supabase
    .from("user_push_tokens")
    .select("push_token")
    .in("user_id", userIds);

  if (tokensError) {
    console.error("notifyUsers: failed to fetch push tokens:", tokensError.message);
    return;
  }

  const tokens = (tokenRows ?? []).map((r) => r.push_token).filter((t): t is string => !!t);
  if (tokens.length === 0) return;

  const { error: invokeError } = await supabase.functions.invoke("send-push", {
    body: { tokens, title, body, data: data ?? {} },
  });

  if (invokeError) {
    console.error("notifyUsers: send-push invocation failed:", invokeError.message);
  }
}
