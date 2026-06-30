import React, { useMemo } from "react";
import { useDivisions } from "../../../hooks/shop/divisions/useDivisions";
import LoadingPage from "../../../components/ui/LoadingPage";
import ErrorPage from "../../../components/ui/errorPage";
import GenericTable from "../../../components/tables/table";
import { getDivisionsColumns } from "../../../components/tables/columns/shops/divisions/DivisionsColumns";

const DivisionsPage = () => {
  const { divisions, error, loading, toggleDivisionActive } = useDivisions();

  const columns = useMemo(
    () => getDivisionsColumns(toggleDivisionActive),
    [toggleDivisionActive],
  );

  if (loading) return <LoadingPage />;
  if (error) return <ErrorPage error={error.message} />;

  return (
    <div className="p-4">
      <GenericTable
        data={divisions}
        columns={columns}
        header={<h1 className="text-2xl font-bold text-gray-800">الأقسام</h1>}
        link="./new"
        linkLabel="+ إضافة قسم جديد"
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

export default DivisionsPage;
