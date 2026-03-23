import React from "react";
import OverviewStatus from "../../components/ui/OverviewStatus";
import { DollarSign, Lock } from "lucide-react";
import { useCompanyFinance } from "../../hooks/company/useCompanyFinance";
import { formatCurrency } from "../../utils/helpper";
import LoadingPage from "../../components/ui/LoadingPage";
import ErrorPage from "../../components/ui/errorPage";

const CompanyOverview = () => {
  const { account, error, loading } = useCompanyFinance();

  // Filter for accounts
  const mainAccount = account?.filter((acc) => acc.type === "main") || [];
  const reserveAccount = account?.filter((acc) => acc.type === "bank") || [];

  // Sum balances
  const totalMainAccount = mainAccount.reduce(
    (sum, acc) => sum + acc.cash_balance + acc.bank_balance,
    0,
  );

  const totalReserveAccount = reserveAccount.reduce(
    (sum, acc) => sum + acc.cash_balance + acc.bank_balance,
    0,
  );

  if (loading) {
    return <LoadingPage label="جاري تحميل البيانات" />;
  }

  if (error) {
    <ErrorPage label="حدث خطاء" error={error.message} />;
  }

  return (
    <div className="p-4">
      <OverviewStatus
        stats={[
          {
            label: "حساب الاساسي",
            value: formatCurrency(totalMainAccount),
            icon: DollarSign,
            iconBgColor: "bg-blue-100",
            iconColor: "text-blue-600",
          },
          {
            label: "حساب الاحتياطي",
            value: formatCurrency(totalReserveAccount),
            icon: Lock,
            iconBgColor: "bg-blue-100",
            iconColor: "text-blue-600",
          },
        ]}
      />
    </div>
  );
};

export default CompanyOverview;
