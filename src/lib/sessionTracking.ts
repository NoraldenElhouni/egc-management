import { supabase } from "./supabaseClient";
import { getOrCreateDeviceId } from "./deviceId";

const APP_ID = "electron";

const electronAPI = () => (window as any).electronAPI;

// Upserts a row in app.user_sessions so we can see who is using this app,
// on what version/platform. Best-effort: never throws, since this must not
// block or break the app it's reporting on.
export const trackSession = async (userId: string): Promise<void> => {
  try {
    const api = electronAPI();
    const [appVersion, systemInfo, deviceId] = await Promise.all([
      api?.getVersion ? api.getVersion() : Promise.resolve("unknown"),
      api?.getSystemInfo
        ? api.getSystemInfo()
        : Promise.resolve({ platform: "unknown", osVersion: undefined }),
      getOrCreateDeviceId(),
    ]);

    const now = new Date().toISOString();

    const { error } = await supabase
      .schema("app")
      .from("user_sessions")
      .upsert(
        {
          user_id: userId,
          app_id: APP_ID,
          app_version: appVersion,
          platform: systemInfo.platform,
          os_version: systemInfo.osVersion ?? null,
          device_id: deviceId,
          locale: navigator.language ?? null,
          last_seen_at: now,
        },
        { onConflict: "user_id,app_id,device_id" },
      );

    if (error) {
      console.warn("Failed to track session:", error);
    }
  } catch (error) {
    console.warn("Failed to track session:", error);
  }
};
