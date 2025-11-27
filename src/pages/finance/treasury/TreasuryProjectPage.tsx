import { useParams } from "react-router-dom";
import BookProjectIncomeTab from "../../../components/finance/bookkeeper/tabs/BookProjectIncomeTab";
import { useBookProject } from "../../../hooks/projects/useBookProjects";

const TreasuryProjectPage = () => {
  const { id } = useParams<{ id: string }>();
  if (!id) {
    return <div>لا يوجد معرف للمشروع</div>;
  }

  const { project, loading, error } = useBookProject(id);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">جارٍ تحميل خزينة المشروع...</p>
        </div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <h3 className="text-red-800 font-semibold mb-2">
            خطأ في تحميل المشروع
          </h3>
          <p className="text-red-600">{error.message}</p>
        </div>
      </div>
    );
  }
  return (
    <div className="p-4">
      <BookProjectIncomeTab project={project} type="treasury" />
    </div>
  );
};

export default TreasuryProjectPage;
