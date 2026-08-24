import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useVendorsQuery } from "../../../../hooks/useVendors";
import { VendorsWithSpecializations } from "../../../../types/extended.type";
import StepsHeader from "../../../ui/StepsHeader";
import MergeStepSelect from "./MergeStepSelect";
import MergeStepCompare from "./MergeStepCompare";
import MergeStepConfirm from "./MergeStepConfirm";
import { MergeVendorValues, defaultMergeVendorValues } from "./mergeTypes";

const steps = [
  { title: "اختيار الموردين" },
  { title: "مقارنة البيانات" },
  { title: "المراجعة والتأكيد" },
];

const MergeVendorsWizard = () => {
  const { data: vendors, isLoading, error } = useVendorsQuery();
  const queryClient = useQueryClient();

  const [step, setStep] = useState(1);
  const [vendorAId, setVendorAId] = useState("");
  const [vendorBId, setVendorBId] = useState("");
  const [survivorId, setSurvivorId] = useState("");
  const [values, setValues] = useState<MergeVendorValues | null>(null);
  // Snapshotted once the user leaves step 1, so steps 2 and 3 keep rendering
  // the same pair even after `handleMerged` invalidates the vendors query
  // and the now-merged loser drops out of the live list.
  const [lockedPair, setLockedPair] = useState<{
    survivor: VendorsWithSpecializations;
    loser: VendorsWithSpecializations;
  } | null>(null);

  const safeVendors = useMemo(() => vendors ?? [], [vendors]);

  const vendorA = safeVendors.find((v) => v.id === vendorAId);
  const vendorB = safeVendors.find((v) => v.id === vendorBId);

  const survivor =
    survivorId === vendorAId
      ? vendorA
      : survivorId === vendorBId
        ? vendorB
        : undefined;
  const loser = survivor === vendorA ? vendorB : vendorA;

  const bothLinked = Boolean(vendorA?.user_id) && Boolean(vendorB?.user_id);
  const sameVendor = Boolean(vendorAId) && vendorAId === vendorBId;

  // Default the survivor pick whenever the two selections change.
  useEffect(() => {
    if (!vendorA || !vendorB || sameVendor) {
      setSurvivorId("");
      return;
    }
    if (survivorId === vendorA.id || survivorId === vendorB.id) return;

    if (vendorA.user_id && !vendorB.user_id) {
      setSurvivorId(vendorA.id);
    } else if (vendorB.user_id && !vendorA.user_id) {
      setSurvivorId(vendorB.id);
    } else {
      setSurvivorId(
        vendorA.created_at <= vendorB.created_at ? vendorA.id : vendorB.id,
      );
    }
  }, [vendorA?.id, vendorB?.id]);

  // Keep the pending defaults in sync with the picked pair while still on
  // step 1 — once the pair is locked in (step >= 2) this must stop reacting,
  // otherwise a background vendors refetch (e.g. right after the merge
  // succeeds) would null these back out from under steps 2/3.
  useEffect(() => {
    if (lockedPair) return;
    if (survivor && loser) {
      setValues(defaultMergeVendorValues(survivor, loser));
    } else {
      setValues(null);
    }
  }, [survivor?.id, loser?.id, lockedPair]);

  // Called right when the merge succeeds — only refreshes the vendors list
  // cache. It must NOT reset the wizard's own state here: that state update
  // would land in the same batch as the child's "show success screen"
  // state, unmounting the success screen before it's ever painted.
  function handleMerged() {
    queryClient.invalidateQueries({ queryKey: ["vendors"] });
  }

  function handleStartOver() {
    setVendorAId("");
    setVendorBId("");
    setSurvivorId("");
    setValues(null);
    setLockedPair(null);
    setStep(1);
  }

  const canProceedStep1 =
    Boolean(vendorA) && Boolean(vendorB) && !bothLinked && !sameVendor && Boolean(survivor);

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto p-6 text-center text-sm text-gray-500">
        جاري تحميل بيانات الموردين...
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto p-6 text-center text-sm text-error">
        فشل تحميل بيانات الموردين
      </div>
    );
  }

  return (
    <div>
      <StepsHeader setStep={setStep} steps={steps} current={step} />

      <div className="mt-4">
        {step === 1 && (
          <MergeStepSelect
            vendors={safeVendors}
            loading={isLoading}
            vendorAId={vendorAId}
            vendorBId={vendorBId}
            onChangeA={setVendorAId}
            onChangeB={setVendorBId}
            survivorId={survivorId}
            onChangeSurvivor={setSurvivorId}
            vendorA={vendorA}
            vendorB={vendorB}
          />
        )}

        {step === 2 && lockedPair && values && (
          <MergeStepCompare
            survivor={lockedPair.survivor}
            loser={lockedPair.loser}
            values={values}
            onChange={setValues}
          />
        )}

        {step === 3 && lockedPair && values && (
          <MergeStepConfirm
            survivor={lockedPair.survivor}
            loser={lockedPair.loser}
            values={values}
            onMerged={handleMerged}
            onStartOver={handleStartOver}
          />
        )}
      </div>

      {step < 3 && (
        <div className="max-w-2xl mx-auto flex justify-between gap-2 mt-4">
          <button
            onClick={() => setStep((p) => Math.max(p - 1, 1))}
            disabled={step === 1}
            className={[
              "px-4 py-2 rounded-md",
              step === 1
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-gray-200 hover:bg-gray-300",
            ].join(" ")}
          >
            السابق
          </button>

          <button
            onClick={() => {
              if (step === 1 && !canProceedStep1) return;
              if (step === 1 && survivor && loser) {
                setLockedPair({ survivor, loser });
              }
              setStep((p) => Math.min(p + 1, 3));
            }}
            disabled={step === 1 && !canProceedStep1}
            className={[
              "px-4 py-2 rounded-md text-white",
              step === 1 && !canProceedStep1
                ? "bg-blue-200 cursor-not-allowed"
                : "bg-blue-500 hover:bg-blue-600",
            ].join(" ")}
          >
            التالي
          </button>
        </div>
      )}
    </div>
  );
};

export default MergeVendorsWizard;
