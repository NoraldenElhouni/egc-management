import React from "react";
import Button from "../../../../../components/ui/Button";
import { FileText, Newspaper, Plus, Wallet } from "lucide-react";
import { Link, useParams } from "react-router-dom";

const ContractDetailsPage = () => {
  const { projectId, contractId } = useParams<{
    projectId: string;
    contractId: string;
  }>();

  return (
    <div className="p-6">
      {/* header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold">تفاصيل العقد</h1>
          <h4 className="text-sm text-gray-500 mt-1">
            CNT-2025-003 · أعمال السباكة — فيلا النور
          </h4>
        </div>

        <div className="flex items-center gap-3">
          <Link to={"../request/12322"} relative="path">
            <Button size="sm" variant="primary-outline">
              <FileText className="w-4 h-4 ml-2" />
              تفاصيل الطلب
            </Button>
          </Link>

          <Button size="sm">
            <Plus className="w-4 h-4 ml-2" />
            إضافة مرحلة
          </Button>

          <Button size="sm">
            <Wallet className="w-4 h-4 ml-2" />
            طلب دفعة
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ContractDetailsPage;
