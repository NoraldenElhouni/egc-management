import React, { useState } from "react";
import Button from "../ui/Button";

const payload = {
  report_date: "2026-03-08",
  total_amount: 50000,
  shareholders: [
    {
      name: "Ahmed",
      amount: 15000,
    },
    {
      name: "Ali",
      amount: 35000,
    },
  ],
};

const SharesPdfButton = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    try {
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
      a.download = `shares.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: unknown) {
      console.error("Error generating invoice:", err);
      if (err instanceof Error) {
        setError("فشل إنشاء الفاتورة: " + err.message);
      } else {
        setError("فشل إنشاء الفاتورة: خطأ غير معروف");
      }
    } finally {
      setLoading(false);
    }
  }
  return (
    <div>
      <Button
        onClick={handleGenerate}
        disabled={loading}
        variant="primary-light"
      >
        {loading ? "جاري الانشاء..." : "انشاء فاتورة"}
      </Button>
      {error && <p className="text-red-500 text-sm">{error}</p>}
    </div>
  );
};

export default SharesPdfButton;
