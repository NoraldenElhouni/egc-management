import { Tags, GalleryHorizontal, Building2, Users } from "lucide-react";
import MenuGrid from "../../../components/ui/MenuGrid";

const WebsitePage = () => {
  const menuItems = [
    {
      label: "التصنيفات",
      icon: Tags,
      path: "/settings/website/categories",
      description: "إدارة تصنيفات المشاريع المعروضة في الموقع",
    },
    {
      label: "الشرائح الرئيسية",
      icon: GalleryHorizontal,
      path: "/settings/website/hero-slides",
      description: "إدارة صور شرائح الصفحة الرئيسية للموقع",
    },
    {
      label: "المشاريع",
      icon: Building2,
      path: "/settings/website/projects",
      description: "إدارة المشاريع وصورها المعروضة في الموقع",
    },
    {
      label: "الفريق",
      icon: Users,
      path: "/settings/website/team",
      description: "إدارة أعضاء الفريق المعروضين في الموقع",
    },
  ];

  return (
    <MenuGrid
      title="إدارة الموقع الإلكتروني"
      items={menuItems}
      columns={{ base: 1, sm: 2, md: 3 }}
    />
  );
};

export default WebsitePage;
