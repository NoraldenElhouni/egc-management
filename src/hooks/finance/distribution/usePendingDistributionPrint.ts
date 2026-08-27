import { useState } from "react";

export interface PendingDistributionPrintProject {
  projectId: string;
  projectName: string;
  projectSerial: number | null;
}

/**
 * Template for printing the "pending distribution" report for one or more
 * projects. There is no backend endpoint for this yet — once one exists,
 * wire it up here following the same shape as useContractorPaymentsPdf:
 * POST the selected projects, turn the response into a blob, and open it.
 */
export function usePendingDistributionPrint() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate(
    projects: PendingDistributionPrintProject[],
  ): Promise<boolean> {
    setLoading(true);
    setError(null);
    try {
      // TODO: replace with a real call once the print endpoint exists, e.g.
      // const res = await fetchManagementApi(
      //   "/api/v1/egc/management/pending-distribution/pdf",
      //   {
      //     method: "POST",
      //     headers: { "Content-Type": "application/json" },
      //     body: JSON.stringify({ projects }),
      //   },
      // );
      // ...turn res into a blob and window.open it, like useContractorPaymentsPdf.
      console.warn(
        "usePendingDistributionPrint: no print endpoint wired up yet.",
        projects,
      );
      setError("ميزة الطباعة غير متاحة بعد");
      return false;
    } finally {
      setLoading(false);
    }
  }

  return { generate, loading, error };
}
