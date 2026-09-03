import { UserPlus, Users } from "lucide-react";
import MenuGrid from "../../components/ui/MenuGrid";

const HrPage = () => {
  const menuItems = [
    {
      label: "الموظفين",
      icon: Users,
      path: "/hr/employees",
      description: "إدارة سجلات الموظفين",
      permission: "view_employees",
    },
    {
      label: "إضافة موظف جديد",
      icon: UserPlus,
      path: "/hr/employees/new",
      description: "تسجيل موظف جديد",
      permission: "create_employee",
    },
    // {
    //   label: "الرواتب",
    //   icon: DollarSign,
    //   path: "/hr/payroll",
    //   description: "الرواتب والتعويضات",
    //   role: ["Manager"],
    // },
    // {
    //   label: "القروض والسلف",
    //   icon: TrendingUp,
    //   path: "/hr/loans-advances",
    //   description: "إدارة القروض والسلف",
    // },
    // {
    //   label: "الحضور والإجازات",
    //   icon: Clock,
    //   path: "/hr/attendance",
    //   description: "متابعة الحضور والإجازات",
    // },
    // {
    //   label: "الإعلانات",
    //   icon: FileText,
    //   path: "/hr/announcements",
    //   description: "إعلانات الموارد البشرية",
    // },
    // {
    //   label: "إعادة تعيين كلمة المرور",
    //   icon: ClipboardList,
    //   path: "/hr/rest-password",
    //   description: "إدارة كلمات المرور",
    // },
  ];

  return (
    <MenuGrid
      title="المالية"
      items={menuItems}
      columns={{ base: 1, sm: 2, md: 3 }}
    />
  );
};

export default HrPage;
