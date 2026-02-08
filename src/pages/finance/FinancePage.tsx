import {
  BookOpen,
  Building2,
  Calculator,
  CreditCard,
  Users,
  Vault,
} from "lucide-react";
import MenuGrid, { MenuItem } from "../../components/ui/MenuGrid";
import { useAuth } from "../../hooks/useAuth";

const FinancePage = () => {
  const { user, loading } = useAuth();

  const menuItems: MenuItem[] = [
    {
      label: "المحاسبة",
      icon: Calculator,
      path: "/finance/accounting",
      description: "إدارة الحسابات",
      role: ["Admin", "Finance"],
    },
    {
      label: "مسك الدفاتر",
      icon: BookOpen,
      path: "/finance/bookkeeping",
      description: "تسجيل القيود المالية",
      role: ["Admin", "Finance", "Bookkeeper"],
    },
    {
      label: "الخزينة",
      icon: Vault,
      path: "/finance/treasury",
      description: "إدارة الخزينة",
      role: ["Admin", "Finance", "Treasurer"],
    },
    {
      label: "المدفوعات",
      icon: CreditCard,
      path: "/finance/payments",
      description: "متابعة المدفوعات",
      role: ["Admin", "Finance", "Bookkeeper"],
    },
    {
      label: "الفواتير",
      icon: Building2,
      path: "/finance/invoices",
      description: "بيانات الفواتير المالية",
      role: ["Admin", "Finance", "Bookkeeper"],
    },
    {
      label: "الشركة",
      icon: Building2,
      path: "/finance/company",
      description: "بيانات الشركة المالية",
      role: ["Admin", "Finance", "Bookkeeper"],
    },
    {
      label: "الرواتب",
      icon: Users,
      path: "/finance/payroll",
      description: "إدارة الرواتب",
      role: ["Admin", "Finance"],
    },
    {
      label: "اضافة مشاريع",
      icon: Building2,
      path: "/finance/projects/add",
      description: "إضافة مشاريع جديدة",
      role: ["Admin", "Finance"],
    },
  ];

  return (
    <MenuGrid
      title="المالية"
      items={menuItems}
      userRole={user?.role}
      loading={loading}
      columns={{ base: 1, sm: 2, md: 3 }}
    />
  );
};

export default FinancePage;
