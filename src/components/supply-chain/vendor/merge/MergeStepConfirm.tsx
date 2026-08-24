import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../../../lib/supabaseClient";
import { VendorsWithSpecializations } from "../../../../types/extended.type";
import Button from "../../../ui/Button";
import ConfirmDialog from "../../../ui/ConfirmDialog";
import { useMergeVendors } from "../../../../hooks/supply-chain/useMergeVendors";
import { MergeVendorValues, vendorLabel } from "./mergeTypes";

interface MergeStepConfirmProps {
  survivor: VendorsWithSpecializations;
  loser: VendorsWithSpecializations;
  values: MergeVendorValues;
  onMerged: () => void;
  onStartOver: () => void;
}

// One literal `.from(...)` call per table — the Supabase client's generated
// types don't allow looping over a dynamic table-name variable here.
function countImpactedRows(loserId: string) {
  return Promise.all([
    supabase
      .from("project_expenses")
      .select("id", { count: "exact", head: true })
      .eq("vendor_id", loserId)
      .then(({ count, error }) => ({ label: "مستخلصات", count, error })),
    supabase
      .from("shop_order_vendor_quotes")
      .select("id", { count: "exact", head: true })
      .eq("vendor_id", loserId)
      .then(({ count, error }) => ({ label: "عروض أسعار", count, error })),
    supabase
      .from("shop_orders")
      .select("id", { count: "exact", head: true })
      .eq("vendor_id", loserId)
      .then(({ count, error }) => ({ label: "طلبات شراء", count, error })),
  ]);
}

const MergeStepConfirm = ({
  survivor,
  loser,
  values,
  onMerged,
  onStartOver,
}: MergeStepConfirmProps) => {
  const navigate = useNavigate();
  const { mergeVendors, loading } = useMergeVendors();

  const [counts, setCounts] = useState<
    { label: string; count: number }[] | null
  >(null);
  const [countsError, setCountsError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadCounts() {
      try {
        const rows = await countImpactedRows(loser.id);
        const firstError = rows.find((r) => r.error)?.error;
        if (firstError) throw firstError;

        if (!cancelled) {
          setCounts(rows.map((r) => ({ label: r.label, count: r.count ?? 0 })));
        }
      } catch (err) {
        console.error("Error loading merge impact counts:", err);
        if (!cancelled) setCountsError("تعذر تحميل عدد السجلات المرتبطة");
      }
    }

    loadCounts();
    return () => {
      cancelled = true;
    };
  }, [loser.id]);

  async function handleConfirm() {
    setConfirmOpen(false);
    setSubmitError(null);

    const { error } = await mergeVendors({
      survivorId: survivor.id,
      loserId: loser.id,
      vendorName: values.vendor_name,
      contactName: values.contact_name,
      email: values.email,
      phoneNumber: values.phone_number,
      altPhoneNumber: values.alt_phone_number,
      whatsappNumber: values.whatsapp_number,
      country: values.country,
      city: values.city,
      address: values.address,
      specializationId: values.specialization_id,
      bankId: values.bank_id,
      bankNumber: values.bank_number,
      bankHolderName: values.bank_holder_name,
    });

    if (error) {
      setSubmitError("فشل دمج الموردين. حاول مرة أخرى.");
      return;
    }

    setSuccess(true);
    onMerged();
  }

  if (success) {
    return (
      <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-sm text-center space-y-4">
        <div className="text-5xl">✅</div>
        <h2 className="text-xl font-bold text-gray-800">تم دمج الموردين بنجاح</h2>
        <p className="text-sm text-gray-500">
          تم تعليم &quot;{vendorLabel(loser)}&quot; كمدمج، وتم نقل جميع
          سجلاته إلى &quot;{vendorLabel(survivor)}&quot;.
        </p>
        <div className="flex justify-center gap-2">
          <Button
            variant="primary"
            size="md"
            onClick={() => navigate(`/supply-chain/vendors/${survivor.id}`)}
          >
            عرض المورد
          </Button>
          <Button variant="muted" size="md" onClick={onStartOver}>
            دمج موردين آخرين
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-sm space-y-4">
      <h2 className="text-lg font-semibold">المراجعة والتأكيد</h2>

      <div className="rounded-lg border bg-gray-50 p-3 text-sm space-y-1">
        <p className="font-semibold text-gray-700 mb-1">
          سيبقى نشطاً: {values.vendor_name}
        </p>
        <p className="text-gray-500">
          سيتم تعليم &quot;{vendorLabel(loser)}&quot; كـ &quot;مدمج&quot; —
          لن يتم حذفه.
        </p>
      </div>

      <div>
        <p className="text-sm font-medium text-gray-700 mb-2">
          السجلات التي سيتم نقلها إلى المورد الأساسي:
        </p>
        {countsError && <p className="text-sm text-error">{countsError}</p>}
        {!counts && !countsError && (
          <p className="text-sm text-gray-400">جاري تحميل البيانات...</p>
        )}
        {counts && (
          <ul className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-gray-600">
            {counts.map((c) => (
              <li key={c.label} className="flex justify-between">
                <span>{c.label}</span>
                <span className="font-medium">{c.count}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {submitError && (
        <p className="text-sm text-error bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {submitError}
        </p>
      )}

      <div className="flex justify-end">
        <Button
          variant="success"
          size="md"
          loading={loading}
          onClick={() => setConfirmOpen(true)}
        >
          تأكيد الدمج
        </Button>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="تأكيد دمج الموردين"
        message="سيتم تحديث بيانات المورد الأساسي ونقل جميع السجلات المرتبطة بالمورد الآخر إليه، وتعليمه كمدمج. لن يتم حذف أي بيانات. هل تريد المتابعة؟"
        confirmLabel="نعم، تأكيد الدمج"
        cancelLabel="إلغاء"
        confirmVariant="success"
        loading={loading}
        onConfirm={handleConfirm}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
};

export default MergeStepConfirm;
