import { useState } from "react";
import {
  DistributionProject,
  calcEmployeeEarnings,
  Currency,
} from "../../hooks/projects/useProjectsDistribute";

interface ShareHolder {
  name: string;
  amount: number;
}

interface SharesReportPayload {
  report_date: string;
  total_amount: number;
  shareholders: ShareHolder[];
}

interface Props {
  projects: DistributionProject[];
}

/**
 * Builds the PDF payload from the distributed projects.
 * Aggregates each employee's earnings across all projects and all currencies,
 * converted to a single display value (LYD-first, then USD, then EUR).
 *
 * If you need per-currency PDFs, call this once per currency and pass a filter.
 */
function buildPayload(projects: DistributionProject[]): SharesReportPayload {
  const CURRENCIES: Currency[] = ["LYD", "USD", "EUR"];
  const today = new Date().toISOString().split("T")[0];

  // Aggregate per employee across all projects + currencies
  const earningsMap = new Map<string, { name: string; amount: number }>();

  projects.forEach((project) => {
    CURRENCIES.forEach((currency) => {
      calcEmployeeEarnings(project, currency).forEach(
        ({ employeeId, name, earning }) => {
          if (earning <= 0) return;
          const prev = earningsMap.get(employeeId) ?? { name, amount: 0 };
          prev.amount += earning;
          earningsMap.set(employeeId, prev);
        },
      );
    });
  });

  const shareholders: ShareHolder[] = Array.from(earningsMap.values()).map(
    (e) => ({ name: e.name, amount: Math.round(e.amount * 100) / 100 }),
  );

  const total = shareholders.reduce((sum, s) => sum + s.amount, 0);

  return {
    report_date: today,
    total_amount: Math.round(total * 100) / 100,
    shareholders,
  };
}

const SharesPdfButton = ({ projects }: Props) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    try {
      const payload = buildPayload(projects);

      const res = await fetch("http://localhost:8000/api/v1/egc/shares/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `shares-${payload.report_date}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: unknown) {
      console.error("Error generating PDF:", err);
      setError(
        err instanceof Error
          ? "فشل إنشاء التقرير: " + err.message
          : "فشل إنشاء التقرير: خطأ غير معروف",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        onClick={handleGenerate}
        disabled={loading}
        className={[
          "px-4 py-2 rounded-md text-white text-sm font-medium flex items-center gap-2",
          loading
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-indigo-600 hover:bg-indigo-700",
        ].join(" ")}
      >
        <span>🖨️</span>
        {loading ? "جاري الإنشاء..." : "طباعة كشف الحصص"}
      </button>
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
};

export default SharesPdfButton;
