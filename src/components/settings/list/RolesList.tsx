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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 py-6 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto space-y-4">
        {/* Page Header */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <h1 className="text-xl font-semibold text-gray-900">قائمة الأدوار</h1>
          <p className="text-xs text-gray-600 mt-1">
            إدارة أدوار النظام والصلاحيات المرتبطة بها
          </p>
        </div>

        {/* Table Card */}
        <div className="bg-white rounded-xl border border-gray-200 p-3 shadow-sm">
          {roles.length === 0 ? (
            <div className="border border-dashed border-gray-300 rounded-lg p-8 text-center">
              <p className="text-sm font-medium text-gray-700">
                لا توجد أدوار حالياً
              </p>
              <p className="text-xs text-gray-500 mt-1">
                قم بإضافة دور جديد للبدء
              </p>
            </div>
          ) : (
            <GenericTable
              data={roles}
              columns={RoleColumns}
              header="الأدوار"
              link="/settings/roles/new"
              linkLabel="إضافة دور جديد"
              linkVariant="primary-light"
              enableSorting
              enableFiltering
              enableRowSelection
              showGlobalFilter
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default RolesList;
