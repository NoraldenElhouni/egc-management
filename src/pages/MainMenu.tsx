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
      permission: "view_employees",
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
      permission: "view_bookkeeping",
    },
    {
      label: "الشركة",
      icon: Building,
      path: "/company",
      permission: "view_distribution",
    },
    {
      label: "التشغيل",
      icon: PackageOpen,
      path: "/operations",
      permission: "view_operations",
    },
    {
      label: "المتاجر",
      icon: Store,
      path: "/shops",
      permission: "view_shop_catalog",
    },
    {
      label: "اداره التنفيذ",
      icon: FolderCog,
      path: "/execution-management",
      permission: "manage_execution",
    },
    {
      label: "الإعدادات",
      icon: Settings,
      path: "/settings",
      permission: [
        "manage_reference_data",
        "manage_specialities",
        "manage_roles",
      ],
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
