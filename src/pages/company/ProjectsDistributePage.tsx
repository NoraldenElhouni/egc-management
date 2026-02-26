import { useMemo, useState } from "react";
import { useProjectsDistribute } from "../../hooks/projects/useProjectsDistribute";
import LoadingPage from "../../components/ui/LoadingPage";
import ErrorPage from "../../components/ui/errorPage";
import StepsHeader from "../../components/ui/StepsHeader";
import StepTwoProjectDistribute from "../../components/company/StepTwoProjectDistribute";
import StepThreeProjectDistribute from "../../components/company/StepThreeProjectDistribute";
import StepOneProjectDistribute from "../../components/company/SetpOneProjectDistibute";

const ProjectsDistributePage = () => {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { projects, loading, error } = useProjectsDistribute();

  const steps = useMemo(
    () => [
      { title: "عرض المشاريع" },
      { title: "مراجعة التوزيع" },
      { title: "ملخص الشركاء" },
    ],
    [],
  );

  const maxStep = steps.length;
  const isLastStep = step === maxStep;

  const handleNextStep = () => setStep((p) => Math.min(p + 1, maxStep));
  const handlePrevStep = () => setStep((p) => Math.max(p - 1, 1));

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      // TODO: persist distribution data to database
      await new Promise((r) => setTimeout(r, 1000));
      console.log("Submitted distribution for projects:", projects);
      window.alert("تم الإرسال بنجاح");
    } catch (e) {
      console.error(e);
      window.alert("حدث خطأ أثناء إرسال البيانات. الرجاء المحاولة مرة أخرى.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <LoadingPage label="جاري تحميل معلومات المشاريع" />;
  if (error)
    return (
      <ErrorPage
        error={error.message || "حدث خطأ أثناء تحميل معلومات المشاريع"}
        label="صفحة توزيع المشاريع"
      />
    );

  const safeProjects = projects ?? [];

  return (
    <div className="p-4">
      <h1 className="text-center text-2xl font-bold mb-2">توزيع المشاريع</h1>

      <StepsHeader setStep={setStep} steps={steps} current={step} />

      {step === 1 && <StepOneProjectDistribute projects={safeProjects} />}
      {step === 2 && <StepTwoProjectDistribute projects={safeProjects} />}
      {step === 3 && <StepThreeProjectDistribute projects={safeProjects} />}

      {/* Navigation */}
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
            className="px-4 py-2 rounded-md text-white bg-blue-500 hover:bg-blue-600"
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
            {isSubmitting ? "جاري الإرسال..." : "تأكيد التوزيع"}
          </button>
        )}
      </div>
    </div>
  );
};

export default ProjectsDistributePage;
