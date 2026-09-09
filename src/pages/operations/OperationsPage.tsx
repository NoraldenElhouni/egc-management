import MenuGrid from "../../components/ui/MenuGrid";
import { useOperationsSectionItems } from "../../hooks/permissions/useOperationsSectionItems";

const OperationsPage = () => {
  const { items, loading } = useOperationsSectionItems();
  const menuItems = items.filter((item) => item.showInMenuGrid !== false);

  return (
    <MenuGrid
      title="ادارة التشغيل"
      items={menuItems}
      loading={loading}
      columns={{ base: 1, sm: 2, md: 3 }}
    />
  );
};

export default OperationsPage;
