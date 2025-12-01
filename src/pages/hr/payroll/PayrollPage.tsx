import { Banknote, Map, Percent } from "lucide-react";
import { useAuth } from "../../../hooks/useAuth";
import MenuGrid, { MenuItem } from "../../../components/ui/MenuGrid";

const PayrollPage = () => {
  const { user, loading } = useAuth();

  const menuItems: MenuItem[] = [
    {
      label: "الرواتب الشهرية",
      icon: Banknote,
      path: "/hr/payroll/monthly",
      description: "ادارة الرواتب الشهرية",
      role: ["Admin", "hr", "Finance"],
    },
    {
      label: "النسب",
      icon: Percent,
      path: "/hr/payroll/percentages",
      description: "ادارة النسب",
      role: ["Admin", "Finance", "hr"],
    },
    {
      label: "الخرائط",
      icon: Map,
      path: "/hr/payroll/maps",
      description: "ادارة الخرائط",
      role: ["Admin", "Finance", "hr"],
    },
  ];
  return (
    <MenuGrid
      title="الرواتب"
      items={menuItems}
      userRole={user?.role}
      loading={loading}
      columns={{ base: 1, sm: 2, md: 3 }}
    />
  );
};

export default PayrollPage;
