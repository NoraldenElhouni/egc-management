import { Link } from "react-router-dom";
import { AlertTriangle, Percent } from "lucide-react";
import { useDistributionProjects } from "../../hooks/company/useProjectDistributions";
import LoadingPage from "../../components/ui/LoadingPage";
import ErrorPage from "../../components/ui/errorPage";

// =====================================================================
// NEW page — Phase 5. Route: /company/shares
// =====================================================================
// A parallel screen. The existing distribute wizard at
// /company/distribute is untouched and keeps working exactly as before.
// Both exist side by side; that is the intended end state of this phase.
// =====================================================================

export default function ProjectSharesListPage() {
  const { data: projects, isLoading, error } = useDistributionProjects();

  if (isLoading) return <LoadingPage label="جاري تحميل نسب المشاريع..." />;
  if (error)
    return (
      <ErrorPage
        error={error instanceof Error ? error.message : "خطأ غير معروف"}
        label="خطأ في تحميل النسب"
      />
    );

  const unbalanced = (projects ?? []).filter((p) => !p.balances).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 py-6 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto space-y-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <h1 className="text-xl font-semibold text-gray-900">
            نسب التوزيع حسب المشروع
          </h1>
          <p className="text-xs text-gray-600 mt-1">
            من يأخذ أي نسبة من كل مشروع. النسبة لا علاقة لها بعضوية الفريق ولا
            تمنح أي صلاحية.
          </p>
          <p className="text-[11px] text-gray-400 mt-2">
            هذه شاشة جديدة تعمل على جدول النسب الجديد. شاشة التوزيع القديمة ما
            زالت تعمل كما هي دون أي تغيير.
          </p>
        </div>

        {unbalanced > 0 && (
          <div className="flex items-start gap-2 border border-amber-200 bg-amber-50 rounded-lg px-4 py-3 text-sm text-amber-800">
            <AlertTriangle size={15} className="mt-0.5 shrink-0" />
            <span>
              {unbalanced} مشروعاً مجموع نسبه لا يساوي 100%. هذا ليس بالضرورة
              خطأ — بعض المشاريع مضبوطة عمداً على أقل من ذلك.
            </span>
          </div>
        )}

        <div className="bg-white rounded-xl border border-gray-200 p-3 shadow-sm">
          <ul className="divide-y divide-gray-100">
            {(projects ?? []).map((project) => (
              <li key={project.projectId}>
                <Link
                  to={`/company/shares/${project.projectId}`}
                  className="flex flex-wrap items-center justify-between gap-3 px-3 py-3 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <span className="flex items-center gap-3 min-w-[220px]">
                    <span className="bg-gray-100 rounded-lg p-2">
                      <Percent size={15} className="text-gray-500" />
                    </span>
                    <span>
                      <span className="block text-sm font-medium text-gray-900">
                        {project.projectName}
                      </span>
                      <span className="block text-[11px] text-gray-400">
                        {project.shareCount} شخص
                      </span>
                    </span>
                  </span>

                  <span className="flex items-center gap-3 text-xs" dir="ltr">
                    <span className="text-gray-500">
                      {project.bankPercentage.toFixed(2)} +{" "}
                      {project.companyPercentage.toFixed(2)} +{" "}
                      {project.peopleTotal.toFixed(2)}
                    </span>
                    <span
                      className={`px-2 py-1 rounded font-semibold ${
                        project.balances
                          ? "bg-green-50 text-green-700 border border-green-200"
                          : "bg-amber-100 text-amber-800 border border-amber-300"
                      }`}
                    >
                      {project.grandTotal.toFixed(2)}%
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
