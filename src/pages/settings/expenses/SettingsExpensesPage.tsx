import AddExpenseForm from "../../../components/settings/form/AddExpenseForm";
import { ExpensesColumns } from "../../../components/tables/columns/ExpensesColumns";
import GenericTable from "../../../components/tables/table";
import ErrorPage from "../../../components/ui/errorPage";
import LoadingPage from "../../../components/ui/LoadingPage";
import { useExpenses } from "../../../hooks/settings/useExpenses";

const SettingsExpensesPage = () => {
  const { error, expenses, setExpenses, loading } = useExpenses();

  if (loading) return <LoadingPage label="جاري التحميل..." />;

  if (error) {
    return (
      <ErrorPage error={error.message} label="حدث خطأ أثناء تحميل البيانات" />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 py-6 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto space-y-4">
        {/* Page Header (compact) */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <h1 className="text-xl font-semibold text-gray-900">
            قائمة المصاريف
          </h1>
          <p className="text-xs text-gray-600 mt-1">
            إضافة المصاريف ومراجعتها وإدارتها من مكان واحد
          </p>
        </div>

        {/* Add Form Card */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <AddExpenseForm
            onAdded={(newExpense) =>
              setExpenses((prev) => [newExpense, ...prev])
            }
          />
        </div>

        {/* Table / Empty State */}
        {expenses.length === 0 ? (
          <div className="bg-white rounded-xl border border-dashed border-gray-300 p-8 text-center">
            <p className="text-sm font-medium text-gray-700">
              لا يوجد أي مصاريف
            </p>
            <p className="text-xs text-gray-500 mt-1">
              ابدأ بإضافة أول مصروف من النموذج بالأعلى
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 p-3 shadow-sm">
            <GenericTable
              columns={ExpensesColumns}
              data={expenses}
              enableFiltering
              enableSorting
              showGlobalFilter
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default SettingsExpensesPage;
