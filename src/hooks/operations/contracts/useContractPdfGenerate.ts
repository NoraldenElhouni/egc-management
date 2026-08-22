import { useState } from "react";
import { ContractorContractPdfRequest } from "./contractPdfPayload";
import { fetchManagementApi } from "../../../lib/managementApiClient";

export function useContractPdfGenerate() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate(payload: ContractorContractPdfRequest) {
    setLoading(true);
    setError(null);
    try {
      const response = await fetchManagementApi(
        "/api/v1/egc/management/contractor-contract/pdf",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );

      if (!response.ok) {
        throw new Error(`${response.status} ${response.statusText}`);
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);

      window.open(url, "_blank");

      // Optional cleanup after some time
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    } catch (err) {
      setError(
        "فشل إنشاء عقد المقاولة: " +
          (err instanceof Error ? err.message : "خطأ غير معروف"),
      );
    } finally {
      setLoading(false);
    }
  }

  return { generate, loading, error };
}
