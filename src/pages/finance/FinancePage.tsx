import {
  BookOpen,
  Building2,
  CreditCard,
  HandCoins,
  Vault,
} from "lucide-react";
import MenuGrid, { MenuItem } from "../../components/ui/MenuGrid";
import { useAuth } from "../../hooks/useAuth";

const FinancePage = () => {
  const { user, loading } = useAuth();

  const menuItems: MenuItem[] = [
    // {
    //   label: "المحاسبة",
    //   icon: Calculator,
    //   path: "/finance/accounting",
    //   description: "إدارة الحسابات",
    //   role: ["Admin", "Finance"],
    // },
    {
      label: "مسك الدفاتر",
      icon: BookOpen,
      path: "/finance/bookkeeping",
      description: "تسجيل القيود المالية",
      role: ["Admin", "Manager", "Bookkeeper", "Head Finance"],
    },
    {
      label: "الخزينة",
      icon: Vault,
      path: "/finance/treasury",
      description: "إدارة الخزينة",
      role: ["Admin", "Manager", "Bookkeeper", "Head Finance"],
    },

    // {
    //   label: "الفواتير",
    //   icon: Building2,
    //   path: "/finance/invoices",
    //   description: "بيانات الفواتير المالية",
    //   role: ["Admin", "Finance", "Bookkeeper"],
    // },
    {
      label: "الشركة",
      icon: Building2,
      path: "/finance/company",
      description: "بيانات الشركة المالية",
      role: ["Admin", "Manager", "Bookkeeper", "Head Finance"],
    },
    // {
    //   label: "الرواتب",
    //   icon: Users,
    //   path: "/finance/payroll",
    //   description: "إدارة الرواتب",
    //   role: ["Manager"],
    // },
    {
      label: "اضافة مشاريع",
      icon: Building2,
      path: "/finance/projects/add",
      description: "إضافة مشاريع جديدة",
      role: ["Admin", "Manager", "Bookkeeper", "Head Finance"],
    },
    {
      label: "المدفوعات",
      icon: CreditCard,
      path: "/finance/payments",
      description: "متابعة المدفوعات",
      role: ["Admin", "Manager", "Bookkeeper", "Head Finance"],
    },
    {
      label: "مدفوعات المقاولين",
      icon: HandCoins,
      path: "/finance/contractor-payments",
      description: "مراجعة دفعات وجزاءات المقاولين",
      role: ["Admin", "Manager", "Bookkeeper", "Head Finance"],
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
