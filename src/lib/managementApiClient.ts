import { getUserData } from "./userStorage";

const MANAGEMENT_API_URL =
  (import.meta.env.VITE_MANAGEMENT_API_URL as string | undefined) ??
  "http://102.203.200.52";

/**
 * fetch() wrapper for the management/reporting backend at MANAGEMENT_API_URL.
 * Adds the required system/requester identification headers to every request
 * without dropping any headers the caller already set.
 */
export const fetchManagementApi = async (
  path: string,
  init: RequestInit = {},
) => {
  const user = await getUserData();

  return fetch(`${MANAGEMENT_API_URL}${path}`, {
    ...init,
    headers: {
      "X-System-Name": "egc-dashboard",
      // Header values must be ISO-8859-1; names can contain Arabic/Unicode, so percent-encode.
      "X-Requester-Name": encodeURIComponent(user?.name ?? "unknown"),
      ...init.headers,
    },
  });
};
