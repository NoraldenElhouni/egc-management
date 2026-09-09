import { FileSignature, HandCoins, ShoppingCart } from "lucide-react";
import MenuGrid, { MenuItem } from "../../components/ui/MenuGrid";
import { usePendingContractorPaymentsCount } from "../../hooks/finance/payments/usePendingContractorPaymentsCount";
import { usePendingOrdersCount } from "../../hooks/finance/orders/usePendingOrdersCount";
import { usePendingRequestPaymentsCount } from "../../hooks/finance/contracts/usePendingRequestPaymentsCount";

const FinanceTrackingPage = () => {
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
      permission: "view_payments",
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
      permission: "view_payments",
      badge: pendingOrdersCount === 0 ? undefined : pendingOrdersCount,
    },
    {
      label: "العقود",
      icon: FileSignature,
      path: "/finance/contracts",
      description: "متابعة العقود",
      permission: "view_payments",
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
      columns={{ base: 1, sm: 2, md: 3 }}
    />
  );
};

export default FinanceTrackingPage;
