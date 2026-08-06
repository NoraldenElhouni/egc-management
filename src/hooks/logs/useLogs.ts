import { useQuery, keepPreviousData } from "@tanstack/react-query";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LogEntry {
  id: number;
  path: string;
  method: string;
  status_code: number;
  duration_ms: number;
  system_name: string;
  requester_name: string;
  payload: Record<string, unknown> | null;
  created_at: string;
}

export interface LogsFilters {
  path?: string;
  method?: string;
  statusCode?: string;
  limit: number;
  offset: number;
}

const LOGS_API_URL =
  (import.meta.env.VITE_LOGS_API_URL as string | undefined) ??
  "http://102.203.200.52";

const LOGS_ENDPOINT_PATH = "/api/v1/logs/";

export interface LogsPage {
  logs: LogEntry[];
  /** Whether the raw (pre-filter) response filled a full page — used for "next" pagination. */
  hasMore: boolean;
}

// ─── Fetcher ──────────────────────────────────────────────────────────────────

const fetchLogs = async (filters: LogsFilters): Promise<LogsPage> => {
  const params = new URLSearchParams();

  if (filters.path) params.append("path", filters.path);
  if (filters.method) params.append("method", filters.method);
  if (filters.statusCode) params.append("status_code", filters.statusCode);
  params.append("limit", String(filters.limit));
  params.append("offset", String(filters.offset));

  const response = await fetch(`${LOGS_API_URL}${LOGS_ENDPOINT_PATH}?${params}`);

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  const raw: LogEntry[] = await response.json();

  return {
    // Hide requests to the logs endpoint itself so viewing this page doesn't spam its own feed.
    logs: raw.filter((entry) => entry.path !== LOGS_ENDPOINT_PATH),
    hasMore: raw.length === filters.limit,
  };
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

export const useLogs = (filters: LogsFilters) =>
  useQuery({
    queryKey: ["logs", filters],
    queryFn: () => fetchLogs(filters),
    placeholderData: keepPreviousData,
  });
