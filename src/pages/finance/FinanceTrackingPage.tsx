import { FileSignature, HandCoins, ShoppingCart } from "lucide-react";
import MenuGrid, { MenuItem } from "../../components/ui/MenuGrid";
import { useAuth } from "../../hooks/useAuth";
import { usePendingContractorPaymentsCount } from "../../hooks/finance/payments/usePendingContractorPaymentsCount";
import { usePendingOrdersCount } from "../../hooks/finance/orders/usePendingOrdersCount";
import { usePendingRequestPaymentsCount } from "../../hooks/finance/contracts/usePendingRequestPaymentsCount";

const FinanceTrackingPage = () => {
  const { user, loading } = useAuth();
  const { count: pendingContractorPaymentsCount } =
    usePendingContractorPaymentsCount();
  const { count: pendingOrdersCount } = usePendingOrdersCount();
  const { count: pendingRequestPaymentsCount } =
    usePendingRequestPaymentsCount();

  const menuItems: MenuItem[] = [
    {
      label: "مدفوعات المقاولين",
      icon: HandCoins,
      path: "/finance/contractor-payments",
      description: "مراجعة دفعات وجزاءات المقاولين",
      role: ["Admin", "Manager", "Bookkeeper", "Head Finance"],
      badge:
        pendingContractorPaymentsCount === 0
          ? undefined
          : pendingContractorPaymentsCount,
    },
    {
      label: "الطلبات",
      icon: ShoppingCart,
      path: "/finance/orders",
      description: "متابعة الطلبات",
      role: ["Admin", "Manager", "Bookkeeper", "Head Finance"],
      badge: pendingOrdersCount === 0 ? undefined : pendingOrdersCount,
    },
    {
      label: "العقود",
      icon: FileSignature,
      path: "/finance/contracts",
      description: "متابعة العقود",
      role: ["Admin", "Manager", "Bookkeeper", "Head Finance"],
      badge:
        pendingRequestPaymentsCount === 0
          ? undefined
          : pendingRequestPaymentsCount,
    },
  ];

  return (
    <MenuGrid
      title="مدفوعات المقاولين والطلبات والعقود"
      items={menuItems}
      userRole={user?.role}
      loading={loading}
      columns={{ base: 1, sm: 2, md: 3 }}
    />
  );
};

export default FinanceTrackingPage;
