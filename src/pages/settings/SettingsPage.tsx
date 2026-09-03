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

const SettingsPage = () => {
  const menuItems = [
    {
      label: "اداره الادوار",
      icon: Users,
      path: "/settings/roles",
      description: "إدارة  الأدوار والصلاحيات",
      permission: "manage_roles",
    },
    {
      label: "اداره اسماء المصروفات",
      icon: Box,
      path: "/settings/expenses",
      description: "إدارة اسماء المصروفات",
      permission: "manage_reference_data",
    },
    {
      label: "اداره التخصصات",
      icon: BookText,
      path: "/settings/specializations",
      description: "إدارة التخصصات",
      permission: "manage_specialities",
    },
    {
      label: "اداره الخرائط",
      icon: Map,
      path: "/settings/maps",
      description: "إدارة الخرائط",
      permission: "manage_reference_data",
    },
    {
      label: "اداره البنوك",
      icon: Landmark,
      path: "/settings/banks",
      description: "إدارة قائمة البنوك",
      permission: "manage_reference_data",
    },
    {
      label: "جلسات المستخدمين",
      icon: Monitor,
      path: "/settings/sessions",
      description: "متابعة الأجهزة والتطبيقات المستخدمة",
      permission: "view_user_sessions",
    },
    {
      label: "السجلات",
      icon: Logs,
      path: "/settings/logs",
      description: "سجلات النظام",
      permission: "view_audit_logs",
    },
    {
      label: "إعادة تعيين كلمة مرور مستخدم",
      icon: KeyRound,
      path: "/settings/password-reset",
      description: "إعادة تعيين كلمة مرور أي مستخدم",
      permission: "reset_user_password",
    },
    {
      label: "إعدادات الموقع",
      icon: Globe,
      path: "/settings/website",
      description: "إعدادات الموقع",
      permission: "manage_website",
    },
  ];

  return (
    <MenuGrid
      title="الإعدادات"
      items={menuItems}
      columns={{ base: 1, sm: 2, md: 3 }}
    />
  );
};

export default SettingsPage;
