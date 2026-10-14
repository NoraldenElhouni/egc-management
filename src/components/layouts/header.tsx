import { Link, useLocation } from "react-router-dom";
import ProfileDropdown from "./ProfileDropdown";
import BackButton from "../ui/BackButton";
import { SEGMENT_NAMES, useBreadcrumbs } from "../../hooks/useBreadcrumbs";

const Header = () => {
  const location = useLocation();

  // Derive a simple page title from the current pathname (you can replace with real routing metadata)
  const titleFromPath = (path: string) => {
    if (path === "/") return "اللوحة الرئيسية";
    if (path.startsWith("/dashboard")) return "لوحة التحكم";
    if (path.startsWith("/hr/employees/new")) return "إضافة موظف جديد";
    if (path.startsWith("/hr/applicants/new")) return "إضافة متقدم جديد";
    if (path.startsWith("/hr/applicants")) return "المتقدمين للوظائف";
    if (path.startsWith("/hr/job-requests/new")) return "طلب توظيف جديد";
    if (path.startsWith("/hr/job-requests")) return "طلبات التوظيف";
    if (path.startsWith("/hr")) return "إدارة الموارد البشرية";
    if (path.startsWith("/crm")) return "إدارة علاقات العملاء";
    if (path.startsWith("/supply-chain")) return "سلسلة التوريد";
    if (path.startsWith("/projects/new")) return "إنشاء مشروع جديد";
    if (path.startsWith("/projects")) return "المشاريع";
    if (path.startsWith("/finance")) return "المالية";
    if (path.startsWith("/profile")) return "الملف الشخصي";
    if (path.startsWith("/settings/evaluation-settings")) return "إعدادات التقييم";
    if (path.startsWith("/settings/question-bank")) return "بنك الأسئلة";
    if (path.startsWith("/settings")) return "الإعدادات";
    if (path.startsWith("/tasks")) return "إدارة المهام";
    if (path.startsWith("/website")) return "إدارة الموقع";
    return "الصفحة";
  };
  const pageTitle = titleFromPath(location.pathname);

  // ids in the path come back named after their record (project name, task title, ...)
  const crumbs = useBreadcrumbs(location.pathname);

  return (
    <header className="h-16 flex  items-center justify-between gap-4 px-4 border-b bg-white shadow-sm">
      {/* Left area: page title & breadcrumb */}
      <div className="flex items-center gap-4 min-w-0">
        <div className="flex items-center gap-3 min-w-0">
          {location.pathname !== "/" && (
            <div>
              <BackButton side="right" />
            </div>
          )}

          <nav aria-label="breadcrumb" className="flex items-center gap-2 min-w-0">
            {crumbs.length === 0 ? (
              <h1 className="text-lg font-semibold text-slate-800">
                <Link to="/">{pageTitle}</Link>
              </h1>
            ) : (
              <ol className="flex items-center gap-2 text-sm text-slate-600 min-w-0 overflow-hidden">
                {/* Home link */}
                <li className="flex items-center shrink-0">
                  <Link to="/" className="hover:underline">
                    {SEGMENT_NAMES[""]}
                  </Link>
                  <span className="text-slate-400 mx-1">/</span>
                </li>

                {/* Each segment */}
                {crumbs.map((crumb, idx) => {
                  const isLast = idx === crumbs.length - 1;
                  const label = crumb.loading ? (
                    <span className="inline-block h-3 w-20 rounded bg-slate-200 animate-pulse align-middle" />
                  ) : (
                    crumb.label
                  );

                  return (
                    <li key={crumb.path} className="flex items-center min-w-0">
                      {isLast ? (
                        <span
                          className="text-lg font-semibold text-slate-800 truncate max-w-[260px]"
                          title={crumb.label}
                        >
                          {label}
                        </span>
                      ) : (
                        <>
                          <Link
                            to={crumb.path}
                            className="hover:underline truncate max-w-[220px]"
                            title={crumb.label}
                          >
                            {label}
                          </Link>
                          <span className="text-slate-400 mx-1">/</span>
                        </>
                      )}
                    </li>
                  );
                })}
              </ol>
            )}
          </nav>
        </div>
      </div>

      {/* Right area: search and profile */}
      <ProfileDropdown />
    </header>
  );
};

export default Header;
