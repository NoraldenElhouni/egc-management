import { Link } from "react-router-dom";
import { ComponentType } from "react";
import { LucideIcon } from "lucide-react";

export interface MenuItem {
  label: string;
  icon: LucideIcon;
  path: string;
  role?: string[];
  description?: string;
  disabled?: boolean;
}

export interface MenuGridProps {
  title?: string;
  items: MenuItem[];
  userRole?: string | null;
  loading?: boolean;
  columns?: {
    base?: number;
    sm?: number;
    md?: number;
    lg?: number;
  };
  cardClassName?: string;
  iconSize?: number;
  direction?: "rtl" | "ltr";
  onItemClick?: (item: MenuItem) => void;
  showDisabledItems?: boolean;
}

const MenuGrid = ({
  title = "القائمة الرئيسية",
  items,
  userRole,
  loading = false,
  columns = { base: 2, sm: 3, md: 4 },
  cardClassName = "bg-gray-100 hover:bg-primary-superLight transition-colors rounded-2xl p-6 text-gray-700 text-center",
  iconSize = 28,
  direction = "rtl",
  onItemClick,
  showDisabledItems = false,
}: MenuGridProps) => {
  // Filter menu items based on user role and loading state
  const visibleItems = items.filter((item) => {
    if (loading) return false;
    if (item.disabled && !showDisabledItems) return false;
    if (!item.role) return true;
    if (!userRole) return false;
    return item.role.includes(userRole);
  });

  // Generate grid columns class
  const gridColsClass = `grid grid-cols-${columns.base} sm:grid-cols-${columns.sm} md:grid-cols-${columns.md} lg:grid-cols-${columns.lg}`;

  const handleItemClick = (item: MenuItem, event: React.MouseEvent) => {
    if (item.disabled) {
      event.preventDefault();
      return;
    }
    onItemClick?.(item);
  };

  return (
    <div className={`h-full w-full p-6 mt-10 bg-background`} dir={direction}>
      {title && (
        <h1 className="text-2xl font-bold mb-6 text-center text-foreground">
          {title}
        </h1>
      )}

      <div className={`${gridColsClass} gap-10`}>
        {visibleItems.map((item, index) => {
          const Icon = item.icon as ComponentType<{
            size?: number;
            className?: string;
          }>;

          const cardContent = (
            <div
              className={`flex flex-col items-center justify-center ${cardClassName} ${
                item.disabled
                  ? "opacity-50 cursor-not-allowed hover:bg-gray-100"
                  : "cursor-pointer"
              }`}
            >
              <div
                className={`mb-3 ${item.disabled ? "text-gray-400" : "text-primary"}`}
              >
                <Icon size={iconSize} />
              </div>
              <span className="text-lg font-medium">{item.label}</span>
              {item.description && (
                <p className="text-sm text-gray-500 mt-2">{item.description}</p>
              )}
            </div>
          );

          if (item.disabled) {
            return (
              <div key={`${item.path}-${index}`} className="relative">
                {cardContent}
              </div>
            );
          }

          return (
            <Link
              key={`${item.path}-${index}`}
              to={item.path}
              onClick={(e) => handleItemClick(item, e)}
              className="block"
            >
              {cardContent}
            </Link>
          );
        })}
      </div>

      {visibleItems.length === 0 && !loading && (
        <div className="text-center py-8 text-gray-500">
          لا توجد عناصر متاحة للعرض
        </div>
      )}
    </div>
  );
};

export default MenuGrid;
