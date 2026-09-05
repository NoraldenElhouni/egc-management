import MenuGrid from "../../components/ui/MenuGrid";
import { FINANCE_ITEMS } from "../../config/navigation/finance";
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

  const menuItems = FINANCE_ITEMS.filter(
    (item) => item.showInMenuGrid !== false,
  ).map((item) =>
    item.path === "/finance/tracking"
      ? {
          ...item,
          badge: trackingBadgeCount === 0 ? undefined : trackingBadgeCount,
        }
      : item,
  );

  return (
    <MenuGrid
      title="المالية"
      items={menuItems}
      columns={{ base: 1, sm: 2, md: 3 }}
    />
  );
};

export default FinancePage;
