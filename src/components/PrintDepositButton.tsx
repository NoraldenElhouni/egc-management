import React, { useState } from "react";
import Button from "./ui/Button";
import { supabase } from "../lib/supabaseClient";

interface PrintDepositButtonProps {
  incomeId: string;
}

const PrintDepositButton = ({ incomeId }: PrintDepositButtonProps) => {
  const [loading, setLoading] = useState(false);

  const handlePrint = async () => {
    setLoading(true);

    try {
      // Fetch income with related project + user info
      const { data, error } = await supabase
        .from("project_incomes")
        .select(
          `
          serial_number,
          description,
          currency,
          amount,
          payment_method,
          fund,
          income_date,
          client_name,
          created_by,

          projects (
            name
          ),

          users!created_by (
            first_name,
            last_name
          )
        `,
        )
        .eq("id", incomeId)
        .single();

      if (error || !data) {
        console.error(error);
        throw new Error("فشل جلب بيانات الدخل");
      }

      // Build payload
      const income = {
        serial_number: String(data.serial_number ?? ""),
        description: data.description ?? "",
        currency: data.currency ?? "LYD",
        amount: Number(data.amount ?? 0),

        payment_method: data.payment_method ?? "",
        fund: data.fund ?? "",

        income_date: data.income_date ?? "",

        client_name: data.client_name ?? "",

        notes: "",

        project_name: (data.projects as any)?.name ?? "",

        created_by: (() => {
          const u = (data as any)?.users;

          if (!u) return data.created_by ?? "";

          return `${u.first_name ?? ""} ${u.last_name ?? ""}`.trim();
        })(),
      };

      console.log("PDF Payload:", income);

      // Call API
      const response = await fetch(
        "http://102.203.200.52/api/v1/egc/management/income/pdf",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(income),
        },
      );

      // Handle backend errors
      if (!response.ok) {
        const errText = await response.text();

        console.error("API Error:", errText);

        throw new Error(`فشل إنشاء PDF (${response.status})`);
      }

      // Check content type
      const contentType = response.headers.get("content-type");

      console.log("Content-Type:", contentType);

      // Convert to blob
      const blob = await response.blob();

      // Validate PDF
      if (!blob.type.includes("pdf") && contentType !== "application/pdf") {
        const text = await blob.text();

        console.error("Non-PDF Response:", text);

        throw new Error("الاستجابة ليست ملف PDF");
      }

      // Download file
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");

      a.href = url;

      a.download = `income-${income.serial_number}.pdf`;

      document.body.appendChild(a);

      a.click();

      a.remove();

      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);

      alert(err instanceof Error ? err.message : "حدث خطأ أثناء تحميل الإيصال");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button onClick={handlePrint} disabled={loading}>
      {loading ? "جارٍ إنشاء الإيصال..." : "طباعة إيصال"}
    </Button>
  );
};

export default PrintDepositButton;
