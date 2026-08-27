import {
  BookOpen,
  Building2,
  ClipboardList,
  CreditCard,
  PieChart,
  Vault,
} from "lucide-react";
import MenuGrid, { MenuItem } from "../../components/ui/MenuGrid";
import { useAuth } from "../../hooks/useAuth";
import { usePendingContractorPaymentsCount } from "../../hooks/finance/payments/usePendingContractorPaymentsCount";
import { usePendingOrdersCount } from "../../hooks/finance/orders/usePendingOrdersCount";
import { usePendingRequestPaymentsCount } from "../../hooks/finance/contracts/usePendingRequestPaymentsCount";

const FinancePage = () => {
  const { user, loading } = useAuth();
  const { count: pendingContractorPaymentsCount } =
    usePendingContractorPaymentsCount();
  const { count: pendingOrdersCount } = usePendingOrdersCount();
  const { count: pendingRequestPaymentsCount } =
    usePendingRequestPaymentsCount();

  const trackingBadgeCount =
    pendingContractorPaymentsCount +
    pendingOrdersCount +
    pendingRequestPaymentsCount;

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
      label: "مدفوعات المقاولين والطلبات والعقود",
      icon: ClipboardList,
      path: "/finance/tracking",
      description: "مدفوعات المقاولين، الطلبات، والعقود",
      role: ["Admin", "Manager", "Bookkeeper", "Head Finance"],
      badge: trackingBadgeCount === 0 ? undefined : trackingBadgeCount,
    },
    {
      label: "مدفوعات قيد التوزيع",
      icon: PieChart,
      path: "/finance/pending-distribution",
      description: "سجل مدفوعات المصاريف غير الموزعة لكل مشروع",
      role: ["Admin", "Manager"],
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
