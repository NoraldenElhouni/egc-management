import React, { useMemo } from "react";
import { useParams } from "react-router-dom";
import { useOrders } from "../../../hooks/shop/orders/useOrders";
import LoadingPage from "../../../components/ui/LoadingPage";
import ErrorPage from "../../../components/ui/errorPage";
import GenericTable from "../../../components/tables/table";
import { getOrdersColumns } from "../../../components/tables/columns/shops/orders/OrdersColumns";

const PorjectsOrdersDetailsPage = () => {
  const { projectId } = useParams<{
    projectId: string;
  }>();

  if (!projectId) return <ErrorPage label="project id not found" />;

  const { orders, error, loading } = useOrders(projectId);

  const columns = useMemo(() => getOrdersColumns(), []);

  if (loading) return <LoadingPage />;
  if (error) return <ErrorPage error={error.message} />;

  // /orders/project/:projectId — show the list
  return (
    <div className="p-4">
      <GenericTable
        data={orders}
        columns={columns}
        header={
          <h1 className="text-2xl font-bold text-gray-800">طلبات المشروع</h1>
        }
        pageSize={10}
        enableSorting
        enablePagination
        enableFiltering
        enableRowSelection
        showGlobalFilter
      />
    </div>
  );
};

export default PorjectsOrdersDetailsPage;
