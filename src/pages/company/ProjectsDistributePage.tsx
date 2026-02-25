import { useProjectsDistribute } from "../../hooks/projects/useProjectsDistribute";
import LoadingPage from "../../components/ui/LoadingPage";
import ErrorPage from "../../components/ui/errorPage";
import { useMemo, useState } from "react";
import SetpOneProjectDistibute from "../../components/company/SetpOneProjectDistibute";
import StepsHeader from "../../components/ui/StepsHeader";
import StepTwoProjectDistribute from "../../components/company/StepTwoProjectDistribute";
import StepThreeProjectDistribute from "../../components/company/StepThreeProjectDistribute";

const ProjectsDistributePage = () => {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { projects, loading, error } = useProjectsDistribute();

  const steps = useMemo(
    () => [{ title: "عرض المشاريع" }, { title: "مراجعة" }, { title: "تم" }],
    [],
  );

  const maxStep = steps.length;

  const handleNextStep = () => {
    setStep((prev) => Math.min(prev + 1, maxStep));
  };

  const handlePrevStep = () => {
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);

      setTimeout(() => {
        console.log("Submitted data:", projects);
      }, 1000);

      setStep(maxStep); // or setStep(3) if last is "تم"
    } catch (e) {
      console.error(e);
      // show toast / setError state
      window.alert("حدث خطأ أثناء إرسال البيانات. الرجاء المحاولة مرة أخرى.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <LoadingPage label="جاري تحميل معلومات المشاريع" />;

  if (error) {
    return (
      <ErrorPage
        error={error.message || "حدث خطأ أثناء تحميل معلومات المشاريع"}
        label="صفحة توزيع المشاريع"
      />
    );
  }
  const isLastStep = step === maxStep;

  return (
    <div className="p-4">
      <h1 className="text-center text-2xl font-bold">توزيع المشاريع</h1>

      {/* Steps UI */}
      <StepsHeader steps={steps} current={step} />

      {/* Step Content */}
      {step === 1 && <SetpOneProjectDistibute projects={projects ?? []} />}
      {step === 2 && <StepTwoProjectDistribute projects={projects ?? []} />}
      {step === 3 && <StepThreeProjectDistribute />}

      {/* Actions */}
      <div className="max-w-4xl mx-auto flex justify-between gap-2 mt-6">
        <button
          onClick={handlePrevStep}
          disabled={step === 1 || isSubmitting}
          className={[
            "px-4 py-2 rounded-md",
            step === 1 || isSubmitting
              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : "bg-gray-200 hover:bg-gray-300",
          ].join(" ")}
        >
          السابق
        </button>

        {!isLastStep ? (
          <button
            onClick={handleNextStep}
            disabled={isSubmitting}
            className={[
              "px-4 py-2 rounded-md text-white",
              isSubmitting
                ? "bg-blue-200 cursor-not-allowed"
                : "bg-blue-500 hover:bg-blue-600",
            ].join(" ")}
          >
            التالي
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className={[
              "px-4 py-2 rounded-md text-white",
              isSubmitting
                ? "bg-green-200 cursor-not-allowed"
                : "bg-green-600 hover:bg-green-700",
            ].join(" ")}
          >
            {isSubmitting ? "جاري الإرسال..." : "إرسال"}
          </button>
        )}
      </div>
    </div>
  );
};

export default ProjectsDistributePage;
