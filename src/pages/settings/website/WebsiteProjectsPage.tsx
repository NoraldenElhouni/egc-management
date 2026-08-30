import { Building2 } from "lucide-react";
import ComingSoonPage from "../../../components/ui/ComingSoonPage";

const WebsiteProjectsPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 py-6 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
            <Building2 className="w-5 h-5 text-indigo-700" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">
              المشاريع
            </h1>
            <p className="text-xs text-gray-600 mt-0.5">
              إدارة المشاريع وصورها المعروضة في الموقع
            </p>
          </div>
        </div>

        <ComingSoonPage
          icon={Building2}
          title="مشاريع الموقع"
          description="إدارة المشاريع وصورها (جدولي projects و project_images) ستكون متاحة قريباً."
        />
      </div>
    </div>
  );
};

export default WebsiteProjectsPage;
