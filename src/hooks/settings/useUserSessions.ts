import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../lib/supabaseClient";

const SESSIONS_QUERY_KEY = ["user-sessions"];

export interface UserSessionRow {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  app_id: string;
  app_label: string;
  app_version: string;
  platform: string;
  platform_label: string;
  os_version: string | null;
  locale: string | null;
  device_id: string | null;
  last_seen_at: string;
  first_seen_at: string;
  is_online: boolean;
}

const APP_LABELS: Record<string, string> = {
  electron: "تطبيق سطح المكتب",
  company_rn: "تطبيق الشركة (جوال)",
  client_rn: "تطبيق العملاء (جوال)",
};

const PLATFORM_LABELS: Record<string, string> = {
  ios: "iOS",
  android: "Android",
  darwin: "macOS",
  win32: "Windows",
  linux: "Linux",
  web: "ويب",
};

// A session counts as "online" if it's checked in within this window —
// the app pings every 5 minutes while open, so allow some slack.
const ONLINE_THRESHOLD_MS = 10 * 60 * 1000;

const fetchUserSessions = async (): Promise<UserSessionRow[]> => {
  const { data: sessions, error: sessionsError } = await supabase
    .schema("app")
    .from("user_sessions")
    .select("*")
    .order("last_seen_at", { ascending: false });

  if (sessionsError) throw sessionsError;
  if (!sessions || sessions.length === 0) return [];

  const userIds = Array.from(new Set(sessions.map((s) => s.user_id)));

  const { data: users, error: usersError } = await supabase
    .from("users")
    .select("id, first_name, last_name, email")
    .in("id", userIds);

  if (usersError) throw usersError;

  const usersById = new Map((users ?? []).map((u) => [u.id, u]));
  const now = Date.now();

  return sessions.map((s) => {
    const user = usersById.get(s.user_id);

    return {
      id: s.id,
      user_id: s.user_id,
      user_name: user
        ? `${user.first_name} ${user.last_name ?? ""}`.trim()
        : "مستخدم غير معروف",
      user_email: user?.email ?? "-",
      app_id: s.app_id,
      app_label: APP_LABELS[s.app_id] ?? s.app_id,
      app_version: s.app_version,
      platform: s.platform,
      platform_label: PLATFORM_LABELS[s.platform] ?? s.platform,
      os_version: s.os_version,
      locale: s.locale,
      device_id: s.device_id,
      last_seen_at: s.last_seen_at,
      first_seen_at: s.first_seen_at,
      is_online: now - new Date(s.last_seen_at).getTime() < ONLINE_THRESHOLD_MS,
    };
  });
};

export const useUserSessions = () => {
  const queryClient = useQueryClient();

  // Push updates: any insert/update/delete on app.user_sessions (new session,
  // heartbeat, etc.) refetches immediately instead of waiting on the interval.
  useEffect(() => {
    const channel = supabase
      .channel("user-sessions-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "app", table: "user_sessions" },
        () => {
          queryClient.invalidateQueries({ queryKey: SESSIONS_QUERY_KEY });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return useQuery({
    queryKey: SESSIONS_QUERY_KEY,
    queryFn: fetchUserSessions,
    // Fallback poll: catches a device going quiet (no more heartbeats to
    // trigger a push) so "متصل الآن" still flips to offline on its own.
    refetchInterval: 60 * 1000,
  });
};
