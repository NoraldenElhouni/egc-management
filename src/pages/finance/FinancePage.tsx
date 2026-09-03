import {
  BookOpen,
  Building2,
  ClipboardList,
  CreditCard,
  PieChart,
  Vault,
} from "lucide-react";
import MenuGrid, { MenuItem } from "../../components/ui/MenuGrid";
import { usePendingContractorPaymentsCount } from "../../hooks/finance/payments/usePendingContractorPaymentsCount";
import { usePendingOrdersCount } from "../../hooks/finance/orders/usePendingOrdersCount";
import { usePendingRequestPaymentsCount } from "../../hooks/finance/contracts/usePendingRequestPaymentsCount";

const FinancePage = () => {
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
      permission: "view_bookkeeping",
    },
    {
      label: "الخزينة",
      icon: Vault,
      path: "/finance/treasury",
      description: "إدارة الخزينة",
      permission: "view_treasury",
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
      permission: "view_company_finance",
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
      permission: "view_projects",
    },
    {
      label: "المدفوعات",
      icon: CreditCard,
      path: "/finance/payments",
      description: "متابعة المدفوعات",
      permission: "view_payments",
    },
    {
      label: "مدفوعات المقاولين والطلبات والعقود",
      icon: ClipboardList,
      path: "/finance/tracking",
      description: "مدفوعات المقاولين، الطلبات، والعقود",
      permission: "view_payments",
      badge: trackingBadgeCount === 0 ? undefined : trackingBadgeCount,
    },
    {
      label: "مدفوعات قيد التوزيع",
      icon: PieChart,
      path: "/finance/pending-distribution",
      description: "سجل مدفوعات المصاريف غير الموزعة لكل مشروع",
      // PHASE 7B: deliberately left on a role check — this screen overlaps
      // the undistributed-expenses work that is paused.
      role: ["Manager"],
    },
  ];

  return (
    <MenuGrid
      title="المالية"
      items={menuItems}
      columns={{ base: 1, sm: 2, md: 3 }}
    />
  );
};

export default FinancePage;
