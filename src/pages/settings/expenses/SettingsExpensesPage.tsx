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
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">قائمة المصاريف</h1>

      {/* ✅ Add at top */}
      <AddExpenseForm
        onAdded={(newExpense) => setExpenses((prev) => [newExpense, ...prev])}
      />

      {expenses.length === 0 ? (
        <div className="rounded-xl border p-6 text-slate-600">
          لا يوجد أي مصاريف
        </div>
      ) : (
        <GenericTable
          columns={ExpensesColumns}
          data={expenses}
          enableFiltering
          enableSorting
          showGlobalFilter
        />
      )}
    </div>
  );
};

export default SettingsExpensesPage;
