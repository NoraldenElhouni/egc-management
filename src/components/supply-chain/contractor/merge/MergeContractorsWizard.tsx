import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useContractorsQuery } from "../../../../hooks/useContractors";
import StepsHeader from "../../../ui/StepsHeader";
import MergeStepSelect from "./MergeStepSelect";
import MergeStepCompare from "./MergeStepCompare";
import MergeStepConfirm from "./MergeStepConfirm";
import { MergeValues, defaultMergeValues } from "./mergeTypes";

const steps = [
  { title: "اختيار المقاولين" },
  { title: "مقارنة البيانات" },
  { title: "المراجعة والتأكيد" },
];

const MergeContractorsWizard = () => {
  const { data: contractors, isLoading, error } = useContractorsQuery();
  const queryClient = useQueryClient();

  const [step, setStep] = useState(1);
  const [contractorAId, setContractorAId] = useState("");
  const [contractorBId, setContractorBId] = useState("");
  const [survivorId, setSurvivorId] = useState("");
  const [values, setValues] = useState<MergeValues | null>(null);

  const safeContractors = useMemo(() => contractors ?? [], [contractors]);

  const contractorA = safeContractors.find((c) => c.id === contractorAId);
  const contractorB = safeContractors.find((c) => c.id === contractorBId);

  const survivor =
    survivorId === contractorAId
      ? contractorA
      : survivorId === contractorBId
        ? contractorB
        : undefined;
  const loser = survivor === contractorA ? contractorB : contractorA;

  const bothLinked = Boolean(contractorA?.user_id) && Boolean(contractorB?.user_id);
  const sameContractor =
    Boolean(contractorAId) && contractorAId === contractorBId;

  // Default the survivor pick whenever the two selections change.
  useEffect(() => {
    if (!contractorA || !contractorB || sameContractor) {
      setSurvivorId("");
      return;
    }
    if (survivorId === contractorA.id || survivorId === contractorB.id) return;

    if (contractorA.user_id && !contractorB.user_id) {
      setSurvivorId(contractorA.id);
    } else if (contractorB.user_id && !contractorA.user_id) {
      setSurvivorId(contractorB.id);
    } else {
      setSurvivorId(
        contractorA.created_at <= contractorB.created_at
          ? contractorA.id
          : contractorB.id,
      );
    }
  }, [contractorA?.id, contractorB?.id]);

  // Reset field choices whenever the survivor/loser pair changes.
  useEffect(() => {
    if (survivor && loser) {
      setValues(defaultMergeValues(survivor, loser));
    } else {
      setValues(null);
    }
  }, [survivor?.id, loser?.id]);

  // Called right when the merge succeeds — only refreshes the contractor
  // list cache. It must NOT reset the wizard's own state here: that state
  // update would land in the same batch as the child's "show success screen"
  // state, unmounting the success screen before it's ever painted.
  function handleMerged() {
    queryClient.invalidateQueries({ queryKey: ["contractors"] });
  }

  function handleStartOver() {
    setContractorAId("");
    setContractorBId("");
    setSurvivorId("");
    setValues(null);
    setStep(1);
  }

  const canProceedStep1 =
    Boolean(contractorA) && Boolean(contractorB) && !bothLinked && !sameContractor && Boolean(survivor);

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto p-6 text-center text-sm text-gray-500">
        جاري تحميل بيانات المقاولين...
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto p-6 text-center text-sm text-error">
        فشل تحميل بيانات المقاولين
      </div>
    );
  }

  return (
    <div>
      <StepsHeader setStep={setStep} steps={steps} current={step} />

      <div className="mt-4">
        {step === 1 && (
          <MergeStepSelect
            contractors={safeContractors}
            loading={isLoading}
            contractorAId={contractorAId}
            contractorBId={contractorBId}
            onChangeA={setContractorAId}
            onChangeB={setContractorBId}
            survivorId={survivorId}
            onChangeSurvivor={setSurvivorId}
            contractorA={contractorA}
            contractorB={contractorB}
          />
        )}

        {step === 2 && survivor && loser && values && (
          <MergeStepCompare
            survivor={survivor}
            loser={loser}
            values={values}
            onChange={setValues}
          />
        )}

        {step === 3 && survivor && loser && values && (
          <MergeStepConfirm
            survivor={survivor}
            loser={loser}
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

export default MergeContractorsWizard;
