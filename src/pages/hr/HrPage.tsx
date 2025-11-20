import {
  ClipboardList,
  Clock,
  DollarSign,
  FileText,
  TrendingUp,
  UserPlus,
  Users,
} from "lucide-react";
import MenuGrid from "../../components/ui/MenuGrid";
import { useAuth } from "../../hooks/useAuth";

const HrPage = () => {
  const { user, loading } = useAuth();

  const menuItems = [
    {
      label: "الموظفين",
      icon: Users,
      path: "/hr/employees",
      description: "إدارة سجلات الموظفين",
    },
    {
      label: "إضافة موظف جديد",
      icon: UserPlus,
      path: "/hr/employees/new",
      description: "تسجيل موظف جديد",
    },
    {
      label: "الرواتب",
      icon: DollarSign,
      path: "/hr/payroll",
      description: "الرواتب والتعويضات",
    },
    {
      label: "القروض والسلف",
      icon: TrendingUp,
      path: "/hr/loans-advances",
      description: "إدارة القروض والسلف",
    },
    {
      label: "الحضور والإجازات",
      icon: Clock,
      path: "/hr/attendance",
      description: "متابعة الحضور والإجازات",
    },
    {
      label: "الإعلانات",
      icon: FileText,
      path: "/hr/announcements",
      description: "إعلانات الموارد البشرية",
    },
    {
      label: "إعادة تعيين كلمة المرور",
      icon: ClipboardList,
      path: "/hr/rest-password",
      description: "إدارة كلمات المرور",
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

export default HrPage;
