export type Project = {
  address: string | null;
  client_id: string;
  code: string;
  created_at: string;
  description: string | null;
  id: string;
  latitude: number | null;
  longitude: number | null;
  name: string;
  percentage: number | null;
  percentage_taken: number;
  serial_number: number | null;
  status: "active" | "paused" | "completed" | "cancelled";
};
