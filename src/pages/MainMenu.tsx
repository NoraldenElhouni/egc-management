import { Link } from "react-router-dom";
import {
  Users,
  MapPin,
  DollarSign,
  LinkIcon,
  ShieldUser,
  Settings,
  Building,
  PackageOpen,
  Store,
  FolderCog,
} from "lucide-react";
import { ComponentType } from "react";
import { useVisibleMenuItems } from "../hooks/permissions/useMenuPermissions";

const MainMenu = () => {
  const menuItems = [
    {
      label: "إدارة الموظفين",
      icon: Users,
      path: "/hr",
      // Issue #19 gap 2: was view_employees, missing anyone who only
      // holds create_employee. Real section permission now.
      permission: "view_hr_section",
    },
    {
      label: "إدارة العملاء",
      icon: ShieldUser,
      path: "/crm",
      permission: "view_clients",
    },
    {
      label: "سلسلة التوريد",
      icon: LinkIcon,
      path: "/supply-chain",
      permission: "view_contractors",
    },
    {
      label: "المشاريع",
      icon: MapPin,
      path: "/projects",
      permission: "view_projects",
    },
    {
      label: "المالية",
      icon: DollarSign,
      path: "/finance",
      // Issue #19 gap 2: was view_bookkeeping, a proxy that missed anyone
      // holding only e.g. view_treasury. Real section permission now.
      permission: "view_finance_section",
    },
    {
      label: "الشركة",
      icon: Building,
      path: "/company",
      permission: "view_company_section",
    },
    {
      label: "التشغيل",
      icon: PackageOpen,
      path: "/operations",
      permission: "view_operations_section",
    },
    {
      label: "المتاجر",
      icon: Store,
      path: "/shops",
      permission: "view_shops_section",
    },
    {
      label: "اداره التنفيذ",
      icon: FolderCog,
      path: "/execution-management",
      permission: "view_execution_section",
    },
    {
      label: "الإعدادات",
      icon: Settings,
      path: "/settings",
      // Issue #19 gap 2: was an OR-array of 3 of the section's 9
      // permissions — missed the other 6 (view_audit_logs,
      // reset_user_password, manage_website, manage_departments,
      // manage_permissions_company, view_user_sessions) entirely. Real
      // section permission now.
      permission: "view_settings_section",
    },
  ];

  const { visibleItems } = useVisibleMenuItems(menuItems);

  return (
    <div className="h-full w-full p-6 mt-10 bg-background" dir="rtl">
      <h1 className="text-2xl font-bold mb-6 text-center text-foreground">
        القائمة الرئيسية
      </h1>

      {/* Grid of cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-10">
        {visibleItems.map((item, index) => {
          const Icon = item.icon as ComponentType<{
            size?: number;
            className?: string;
          }>;
          return (
            <Link
              key={index}
              to={item.path}
              className="flex flex-col items-center justify-center bg-gray-100 hover:bg-primary-superLight transition-colors rounded-2xl p-6 text-gray-700 text-center"
            >
              <div className="mb-3 text-primary">
                <Icon size={28} />
              </div>
              <span className="text-lg font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default MainMenu;
