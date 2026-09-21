import { supabase } from "../../lib/supabaseClient";

// =====================================================================
// Push notifications via the deployed "send-push" Supabase Edge
// Function (Deno, forwards to Expo's push API — see its source under
// the linked project's Edge Functions). Routed through the function
// rather than hitting Expo's API directly from this client, unlike
// Fields' services/Notification/Notification.ts (its own, older,
// direct-to-Expo helper) — keeps the push call server-side, in one
// place shared by both apps.
//
// Two entry points, one implementation:
//
//   notifyUsers()         fire-and-forget. What every background push
//                         (assignment, dependency cleared) wants: a
//                         missed push must never fail the mutation that
//                         triggered it.
//   notifyUsersDetailed() reports what happened. For a push a person
//                         deliberately pressed a button to send, where
//                         silence is not an acceptable answer.
//
// The detailed variant is not just a wider return type — it needs
// `user_id` back from the token query to say WHO was unreachable, which
// the original query discarded.
// =====================================================================

/** Expo accepts at most 100 messages per request. 90 leaves headroom in
 *  case the Edge Function prepends or splits anything of its own — and
 *  chunking here is correct whether or not it also chunks internally. */
const CHUNK_SIZE = 90;

export interface PushDeliveryResult {
  /** Deduped input. */
  requestedUserIds: string[];
  /** Had a row in user_push_tokens — i.e. has signed into the Fields
   *  mobile app at least once. */
  reachableUserIds: string[];
  /** No token on file. The desktop app never registers one, so anyone
   *  who only uses Desktop lands here and cannot be reached at all. */
  unreachableUserIds: string[];
  /** Reachable, but their chunk's invocation errored. */
  failedUserIds: string[];
  tokensSent: number;
  chunksSent: number;
  chunksFailed: number;
  errors: string[];
  /** Every chunk went out and at least one token was sent. Note this
   *  means "the Edge Function accepted the request" — NOT that Expo
   *  accepted the tokens, and not that any phone displayed anything.
   *  Expo receipts are never read back anywhere in this codebase. */
  ok: boolean;
}

/** Sends a push to every device token on file for the given users, and
 *  reports the outcome. Never throws — every failure is captured in the
 *  returned `errors` and reflected in `ok`. */
export async function notifyUsersDetailed(
  userIds: string[],
  title: string,
  body: string,
  data?: Record<string, unknown>,
): Promise<PushDeliveryResult> {
  const requestedUserIds = Array.from(new Set(userIds));

  const empty: PushDeliveryResult = {
    requestedUserIds,
    reachableUserIds: [],
    unreachableUserIds: requestedUserIds,
    failedUserIds: [],
    tokensSent: 0,
    chunksSent: 0,
    chunksFailed: 0,
    errors: [],
    ok: false,
  };

  if (requestedUserIds.length === 0) return { ...empty, unreachableUserIds: [] };

  const { data: tokenRows, error: tokensError } = await supabase
    .from("user_push_tokens")
    .select("user_id, push_token")
    .in("user_id", requestedUserIds);

  if (tokensError) {
    return { ...empty, errors: [`failed to fetch push tokens: ${tokensError.message}`] };
  }

  // One row per user (user_push_tokens has UNIQUE on user_id), but pair
  // them up anyway so a future multi-device table needs no change here.
  const pairs = (tokenRows ?? [])
    .filter((r): r is { user_id: string; push_token: string } => !!r.user_id && !!r.push_token)
    .filter((r) => requestedUserIds.includes(r.user_id));

  const reachableUserIds = Array.from(new Set(pairs.map((r) => r.user_id)));
  const unreachableUserIds = requestedUserIds.filter((id) => !reachableUserIds.includes(id));

  if (pairs.length === 0) {
    return { ...empty, reachableUserIds, unreachableUserIds };
  }

  const errors: string[] = [];
  const failedUserIds: string[] = [];
  let tokensSent = 0;
  let chunksSent = 0;
  let chunksFailed = 0;

  // Sequential, and a failed chunk does NOT abort the rest: a partial
  // send has to be reported as partial. Sequential also avoids a burst
  // of concurrent invocations tripping Expo's rate limit.
  for (let i = 0; i < pairs.length; i += CHUNK_SIZE) {
    const chunk = pairs.slice(i, i + CHUNK_SIZE);
    const { error: invokeError } = await supabase.functions.invoke("send-push", {
      body: { tokens: chunk.map((r) => r.push_token), title, body, data: data ?? {} },
    });

    if (invokeError) {
      chunksFailed++;
      errors.push(`send-push invocation failed: ${invokeError.message}`);
      failedUserIds.push(...chunk.map((r) => r.user_id));
    } else {
      chunksSent++;
      tokensSent += chunk.length;
    }
  }

  return {
    requestedUserIds,
    reachableUserIds,
    unreachableUserIds,
    failedUserIds: Array.from(new Set(failedUserIds)),
    tokensSent,
    chunksSent,
    chunksFailed,
    errors,
    ok: chunksFailed === 0 && tokensSent > 0,
  };
}

/** Sends a push to every device token on file for the given users.
 *  Silently no-ops (logs, doesn't throw) if nobody has a token or the
 *  function call fails — a missed push shouldn't fail the mutation that
 *  triggered it.
 *
 *  Deliberately returns void: callers are `void notifyUsers(...)` inside
 *  mutation bodies, and this contract is what keeps a failed push from
 *  becoming a failed save. If you need to know what happened, you want
 *  notifyUsersDetailed() instead. */
export async function notifyUsers(
  userIds: string[],
  title: string,
  body: string,
  data?: Record<string, unknown>,
): Promise<void> {
  const result = await notifyUsersDetailed(userIds, title, body, data);
  for (const message of result.errors) console.error("notifyUsers:", message);
}
