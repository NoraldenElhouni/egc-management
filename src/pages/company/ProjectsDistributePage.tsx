import { useMemo, useState } from "react";
import {
  useProjectsDistribute,
  DistributionProject,
} from "../../hooks/projects/useProjectsDistribute";
import { supabase } from "../../lib/supabaseClient";
import LoadingPage from "../../components/ui/LoadingPage";
import ErrorPage from "../../components/ui/errorPage";
import StepsHeader from "../../components/ui/StepsHeader";
import StepTwoProjectDistribute from "../../components/company/StepTwoProjectDistribute";
import StepThreeProjectDistribute from "../../components/company/StepThreeProjectDistribute";
import StepOneProjectDistribute from "../../components/company/SetpOneProjectDistibute";
import SharesPdfButton from "../../components/pdf-buttons/SharesPdfButton";

const ProjectsDistributePage = () => {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Holds the snapshot of projects that were just distributed — used for PDF
  const [distributedProjects, setDistributedProjects] = useState<
    DistributionProject[] | null
  >(null);

  const { projects, loading, error, submitDistribution } =
    useProjectsDistribute();

  const steps = useMemo(
    () => [
      { title: "عرض المشاريع" },
      { title: "مراجعة التوزيع" },
      { title: "ملخص الشركاء" },
    ],
    [],
  );

  const maxStep = steps.length;

  const handleSubmit = async () => {
    if (!projects || projects.length === 0) {
      window.alert("لا توجد مشاريع للتوزيع");
      return;
    }

    try {
      setIsSubmitting(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        window.alert("لم يتم التعرف على المستخدم. الرجاء تسجيل الدخول.");
        return;
      }

      const result = await submitDistribution(projects, user.id);

      if (!result.success) {
        window.alert(`حدث خطأ: ${result.error}`);
        return;
      }

      // Save snapshot for PDF, then show success screen
      setDistributedProjects([...projects]);
    } catch (e) {
      console.error(e);
      window.alert("حدث خطأ أثناء إرسال البيانات. الرجاء المحاولة مرة أخرى.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setDistributedProjects(null);
    setStep(1);
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

  // ── Success screen ────────────────────────────────────────────────────────
  if (distributedProjects) {
    return (
      <div className="p-4 flex flex-col items-center justify-center min-h-[60vh] gap-6">
        {/* Success card */}
        <div className="bg-white rounded-xl border shadow-sm p-8 max-w-md w-full text-center space-y-4">
          <div className="text-5xl">✅</div>
          <h2 className="text-xl font-bold text-gray-800">
            تم تأكيد التوزيع بنجاح
          </h2>
          <p className="text-sm text-gray-500">
            تم إنشاء كشوف الرواتب وتحديث أرصدة الموظفين والحسابات.
          </p>

          {/* Employee summary */}
          <div className="rounded-lg border bg-gray-50 p-3 text-sm text-right space-y-1">
            <p className="font-semibold text-gray-700 mb-2 text-center">
              ملخص الحصص
            </p>
            {distributedProjects.flatMap((project) =>
              (project.project_assignments ?? []).map((a) => {
                const name =
                  `${a.employee.first_name} ${a.employee.last_name ?? ""}`.trim();
                return (
                  <div
                    key={`${project.id}-${a.employee.id}`}
                    className="flex justify-between text-gray-600"
                  >
                    <span>👤 {name}</span>
                    <span className="text-xs text-gray-400">
                      {a.percentage}% — {project.name}
                    </span>
                  </div>
                );
              }),
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2 pt-2">
            <SharesPdfButton projects={distributedProjects} />
            <button
              onClick={handleReset}
              className="px-4 py-2 rounded-md text-sm bg-gray-100 hover:bg-gray-200 text-gray-600"
            >
              توزيع جديد
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Normal wizard ─────────────────────────────────────────────────────────
  return (
    <div className="p-4">
      <h1 className="text-center text-2xl font-bold mb-2">توزيع المشاريع</h1>

      <StepsHeader setStep={setStep} steps={steps} current={step} />

      {step === 1 && <StepOneProjectDistribute projects={safeProjects} />}
      {step === 2 && <StepTwoProjectDistribute projects={safeProjects} />}
      {step === 3 && <StepThreeProjectDistribute projects={safeProjects} />}

      <div className="max-w-4xl mx-auto flex justify-between gap-2 mt-6">
        <button
          onClick={() => setStep((p) => Math.max(p - 1, 1))}
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

        {step < maxStep ? (
          <button
            onClick={() => setStep((p) => Math.min(p + 1, maxStep))}
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
