import { useParams } from "react-router-dom";
import { useProjectDistribution } from "../../hooks/company/useProjectDistributions";
import ProjectSharesEditor from "../../components/company/shares/ProjectSharesEditor";
import BackButton from "../../components/ui/BackButton";
import LoadingPage from "../../components/ui/LoadingPage";
import ErrorPage from "../../components/ui/errorPage";

// =====================================================================
// NEW page — Phase 5. Route: /company/shares/:projectId
// =====================================================================
// Implementation guide section 4.5.
//
// Note what is NOT on this page: no team roster, no project role, and no
// link to the Team screen. Reaching this screen and reaching the Team
// screen are two separate journeys from two separate menu entries,
// because they are two separate facts.
// =====================================================================

export default function ProjectSharesDetailPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { data, isLoading, error } = useProjectDistribution(projectId);

  if (!projectId) {
    return (
      <div className="p-4">
        <ErrorPage
          error="رقم المشروع غير موجود في الرابط"
          label="خطأ في المعلومات"
        />
      </div>
    );
  }

  if (isLoading) return <LoadingPage label="جاري تحميل النسب..." />;
  if (error || !data)
    return (
      <ErrorPage
        error={error instanceof Error ? error.message : "تعذّر تحميل المشروع"}
        label="خطأ في تحميل النسب"
      />
    );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 py-6 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto space-y-4">
        <BackButton />

        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <h1 className="text-xl font-semibold text-gray-900">
            {data.summary.projectName}
          </h1>
          <p className="text-xs text-gray-600 mt-1">
            نسب التوزيع لهذا المشروع.
          </p>
        </div>

        <ProjectSharesEditor summary={data.summary} shares={data.shares} />
      </div>
    </div>
  );
}
