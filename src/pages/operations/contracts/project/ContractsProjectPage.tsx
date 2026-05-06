import React from "react";
import {
  useContracts,
  useWorkRequests,
} from "../../../../hooks/operations/useContracts";
import { useParams } from "react-router-dom";
import LoadingPage from "../../../../components/ui/LoadingPage";
import ErrorPage from "../../../../components/ui/errorPage";
import GenericTable from "../../../../components/tables/table";
import { ContractsColumns } from "../../../../components/tables/columns/ContractsColumns";
import Separator from "../../../../components/ui/separator";
import { WorkRequestsColumns } from "../../../../components/tables/columns/WorkRequestsColumns";

const ContractsProjectPage = () => {
  const { projectId } = useParams<{ projectId: string }>();

  if (!projectId) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <p className="text-gray-600">No project Id found</p>
      </div>
    );
  }

  const { contracts, error, loading } = useContracts(projectId);
  const {
    workRequests,
    error: workError,
    loading: workLoading,
  } = useWorkRequests(projectId);

  if (loading || workLoading) {
    return <LoadingPage label="Loading project details..." />;
  }
  if (error || workError) {
    return (
      <ErrorPage
        label="حدث خطأ أثناء تحميل بيانات المشروع"
        error={error?.message || workError?.message}
      />
    );
  }

  return (
    <div className="p-4">
      <GenericTable
        header="جميع العقود"
        linkLabel="+ عقد جديد"
        link={`new`}
        data={contracts ?? []}
        columns={ContractsColumns}
        enableSorting
        enableFiltering
        showGlobalFilter
      />
      <Separator />
      <GenericTable
        header="جميع الطلبات"
        data={workRequests ?? []}
        columns={WorkRequestsColumns}
        enableSorting
        enableFiltering
        showGlobalFilter
      />
    </div>
  );
};

export default ContractsProjectPage;
