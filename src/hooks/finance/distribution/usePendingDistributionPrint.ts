import { useState } from "react";
import { fetchManagementApi } from "../../../lib/managementApiClient";

export interface PendingDistributionPrintExpense {
  serial_number: string;
  description: string;
  amount: number;
  date: string;
}

export interface PendingDistributionPrintProject {
  project_name: string;
  expenses: PendingDistributionPrintExpense[];
}

export function usePendingDistributionPrint() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate(
    projects: PendingDistributionPrintProject[],
  ): Promise<boolean> {
    setLoading(true);
    setError(null);
    try {
      const payload = {
        report_title: "تقرير المصروفات",
        report_date: new Date().toISOString().slice(0, 10),
        projects,
      };

      const response = await fetchManagementApi(
        "/api/v1/egc/management/expenses/pdf",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );

      if (!response.ok) {
        let detail = "";
        try {
          const body = (await response.json()) as {
            detail?: string | { msg?: string }[];
          };
          if (typeof body.detail === "string") {
            detail = `: ${body.detail}`;
          } else if (Array.isArray(body.detail)) {
            detail = `: ${body.detail
              .map((item) => item.msg)
              .filter(Boolean)
              .join(", ")}`;
          }
        } catch {
          // Keep the HTTP status when the response is not JSON.
        }
        throw new Error(`${response.status} ${response.statusText}${detail}`);
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
      setTimeout(() => URL.revokeObjectURL(url), 10000);

      return true;
    } catch (err) {
      console.error("Error generating pending distribution PDF:", err);
      setError(
        "فشل إنشاء التقرير: " +
          (err instanceof Error ? err.message : "خطأ غير معروف"),
      );
      return false;
    } finally {
      setLoading(false);
    }
  }

  return { generate, loading, error };
}
