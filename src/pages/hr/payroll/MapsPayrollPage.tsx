import { Building2, RefreshCw } from "lucide-react";
import Button from "../../../components/ui/Button";
import ProjectsList from "../../../components/project/lists/ProjectsList";

const MapsPayrollPage = () => {
  return (
    <div className="p-4 space-y-6" dir="rtl">
      <div className="flex items-center justify-between bg-white p-4 rounded-lg shadow-sm border border-gray-100">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
            <Building2 size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">المشاريع</h2>
            <p className="text-sm text-gray-500">إدارة خرائط المشاريع</p>
          </div>
        </div>
        <Button
          onClick={() => window.location.reload()}
          variant="primary"
          className="flex items-center gap-2"
        >
          <RefreshCw size={16} />
          <span>تحديث</span>
        </Button>
      </div>
      <ProjectsList basePath="/hr/payroll/maps" />
    </div>
  );
};

export default MapsPayrollPage;
