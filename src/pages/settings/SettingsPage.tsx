import {
  BookText,
  Box,
  Globe,
  KeyRound,
  Landmark,
  Logs,
  Map,
  Monitor,
  Users,
} from "lucide-react";
import MenuGrid from "../../components/ui/MenuGrid";
import { useAuth } from "../../hooks/useAuth";

const SettingsPage = () => {
  const { user, loading } = useAuth();

  const menuItems = [
    {
      label: "اداره الادوار",
      icon: Users,
      path: "/settings/roles",
      description: "إدارة  الأدوار والصلاحيات",
      role: ["Admin", "Manager", "Bookkeeper"],
    },
    {
      label: "اداره اسماء المصروفات",
      icon: Box,
      path: "/settings/expenses",
      description: "إدارة اسماء المصروفات",
      role: ["Admin", "Manager", "Bookkeeper"],
    },
    {
      label: "اداره التخصصات",
      icon: BookText,
      path: "/settings/specializations",
      description: "إدارة التخصصات",
      role: ["Admin", "Engineer", "Manager", "Bookkeeper"],
    },
    {
      label: "اداره الخرائط",
      icon: Map,
      path: "/settings/maps",
      description: "إدارة الخرائط",
      role: ["Admin", "Manager", "Bookkeeper"],
    },
    {
      label: "اداره البنوك",
      icon: Landmark,
      path: "/settings/banks",
      description: "إدارة قائمة البنوك",
      role: ["Admin", "Manager", "Bookkeeper"],
    },
    {
      label: "جلسات المستخدمين",
      icon: Monitor,
      path: "/settings/sessions",
      description: "متابعة الأجهزة والتطبيقات المستخدمة",
      role: ["Admin"],
    },
    {
      label: "السجلات",
      icon: Logs,
      path: "/settings/logs",
      description: "سجلات النظام",
      role: ["Admin"],
    },
    {
      label: "إعادة تعيين كلمة مرور مستخدم",
      icon: KeyRound,
      path: "/settings/password-reset",
      description: "إعادة تعيين كلمة مرور أي مستخدم",
      role: ["Admin", "Manager"],
    },
    {
      label: "إعدادات الموقع",
      icon: Globe,
      path: "/settings/website",
      description: "إعدادات الموقع",
      role: ["Admin", "Manager"],
    },
  ];

  return (
    <MenuGrid
      title="الإعدادات"
      items={menuItems}
      userRole={user?.role}
      loading={loading}
      columns={{ base: 1, sm: 2, md: 3 }}
    />
  );
};

export default SettingsPage;
