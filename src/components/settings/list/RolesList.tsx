import { useRoles } from "../../../hooks/settings/useRoles";
import { RoleColumns } from "../../tables/columns/RoleColumns";
import GenericTable from "../../tables/table";
import ErrorPage from "../../ui/errorPage";
import LoadingPage from "../../ui/LoadingPage";

const RolesList = () => {
  const { roles, loading, error } = useRoles();
  if (loading) return <LoadingPage label="جاري تحميل الأدوار..." />;
  if (error)
    return <ErrorPage error={error.message} label="خطأ في تحميل الأدوار" />;
  return (
    <div>
      <GenericTable
        data={roles}
        columns={RoleColumns}
        header="قائمة الأدوار"
        link="/settings/roles/new"
        linkLabel="إضافة دور جديد"
        linkVariant="primary-light"
        enableSorting
        enableFiltering
        enableRowSelection
        showGlobalFilter
      />
    </div>
  );
};

export default RolesList;
