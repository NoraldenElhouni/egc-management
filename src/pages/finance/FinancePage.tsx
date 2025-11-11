import { Link } from "react-router-dom";

const FinancePage = () => {
  return (
    <div className="bg-background  text-foreground">
      <header className="flex items-center justify-between gap-4 mb-6"></header>
      <main>
        <h2 className="text-foreground">مرحبًا بك في صفحة إدارة المالية</h2>
        <div>
          <Link to="/finance/accounting">إدارة المحاسبة</Link>
          <Link to="/finance/bookkeeping">إدارة الدفاتر</Link>
          <Link to="/finance/treasury">إدارة الخزينة</Link>
          <Link to="/finance/payments">إدارة المدفوعات</Link>
          <Link to="/finance/company">إدارة الشركة</Link>
        </div>
      </main>
    </div>
  );
};

export default FinancePage;
