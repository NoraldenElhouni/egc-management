import { Link } from "react-router-dom";
import { ComponentType } from "react";
import { LucideIcon } from "lucide-react";
import { useVisibleMenuItems } from "../../hooks/permissions/useMenuPermissions";
import type { PermissionGatedItem } from "../../hooks/permissions/useMenuPermissions";

// =====================================================================
// PHASE 7B BATCH 5 — MenuGrid asks the resolver, not the caller
// =====================================================================
// `role?: string[]` and the `userRole` prop are gone. Every caller used
// to pass `userRole={user?.role}` and MenuGrid matched it against a
// hardcoded list; now MenuGrid resolves the current user's permissions
// itself. Callers no longer need useAuth at all.
//
// `loading` remains a prop, but it now means "the page's own data is
// still loading" — the permission check has its own loading state and
// is handled internally.
// =====================================================================

export interface MenuItem extends PermissionGatedItem {
  label: string;
  icon: LucideIcon;
  path: string;
  description?: string;
  disabled?: boolean;
  /** Small red corner badge — a number (e.g. 3) or text (e.g. "جديد", "1 مراجعة"). Falsy values render nothing. */
  badge?: number | string;
}

export interface MenuGridProps {
  title?: string;
  items: MenuItem[];
  /** The page's own data loading, not the permission check. */
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
  loading = false,
  columns = { base: 2, sm: 3, md: 4 },
  cardClassName = "bg-gray-100 hover:bg-primary-superLight transition-colors rounded-2xl p-6 text-gray-700 text-center",
  iconSize = 28,
  direction = "rtl",
  onItemClick,
  showDisabledItems = false,
}: MenuGridProps) => {
  // Permission filtering lives in one shared hook; this component only
  // adds its own disabled/loading rules on top.
  const { visibleItems: permittedItems, loading: checkingPermissions } =
    useVisibleMenuItems(items);

  const visibleItems = permittedItems.filter((item) => {
    if (loading || checkingPermissions) return false;
    if (item.disabled && !showDisabledItems) return false;
    return true;
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
              className={`relative flex flex-col items-center justify-center ${cardClassName} ${
                item.disabled
                  ? "opacity-50 cursor-not-allowed hover:bg-gray-100"
                  : "cursor-pointer"
              }`}
            >
              {item.badge && (
                <span className="absolute -top-2 -end-2 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-600 px-1.5 text-xs font-bold text-white shadow-sm ring-2 ring-white">
                  {item.badge}
                </span>
              )}
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

      {visibleItems.length === 0 && !loading && !checkingPermissions && (
        <div className="text-center py-8 text-gray-500">
          لا توجد عناصر متاحة للعرض
        </div>
      )}
    </div>
  );
};

export default MenuGrid;
