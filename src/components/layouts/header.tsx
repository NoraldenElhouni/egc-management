import { Link, useLocation } from "react-router-dom";
import ProfileDropdown from "./ProfileDropdown";
import BackButton from "../ui/BackButton";

const Header = () => {
  const location = useLocation();

  // Derive a simple page title from the current pathname (you can replace with real routing metadata)
  const titleFromPath = (path: string) => {
    if (path === "/") return "اللوحة الرئيسية";
    if (path.startsWith("/dashboard")) return "لوحة القيادة";
    if (path.startsWith("/hr/employees/new")) return "إضافة موظف جديد";
    if (path.startsWith("/hr")) return "إدارة الموارد البشرية";
    if (path.startsWith("/crm")) return "إدارة علاقات العملاء";
    if (path.startsWith("/supply-chain")) return "سلسلة التوريد";
    if (path.startsWith("/projects/new")) return "إنشاء مشروع جديد";
    if (path.startsWith("/projects")) return "المشاريع";
    if (path.startsWith("/finance")) return "المالية";
    if (path.startsWith("/profile")) return "الملف الشخصي";
    if (path.startsWith("/settings")) return "الإعدادات";
    if (path.startsWith("/website")) return "إدارة الموقع";
    return "الصفحة";
  };
  const pageTitle = titleFromPath(location.pathname);

  const parts = location.pathname
    .split("/")
    .filter(Boolean)
    .filter((seg) => !/^[0-9a-fA-F-]{8,}$/.test(seg));

  // Simple human-friendly labels for common route segments
  const segmentNames: Record<string, string> = {
    "": "اللوحة الرئيسية",
    dashboard: "لوحة القيادة",
    hr: "الموارد البشرية",
    employees: "الموظفين",
    employee: "الموظف",
    crm: "إدارة علاقات العملاء",
    "supply-chain": "سلسلة التوريد",
    projects: "المشاريع",
    project: "المشروع",
    finance: "المالية",
    profile: "الملف الشخصي",
    settings: "الإعدادات",
    website: "إدارة الموقع",
    new: "جديد",
    attendance: "الحضور والإجازات",
    payroll: "الرواتب",
    "loans-advances": "القروض والسلف",
    announcements: "الإعلانات",
    "rest-password": "إعادة تعيين كلمة المرور",
    treasury: "الخزانة",
    payments: "المدفوعات",
    company: "الشركة",
    accounting: "المحاسبة",
    bookkeeping: "مسك الدفاتر",
    vendors: "الموردين",
    contractors: "المقاولون",
    clients: "العملاء",
    expense: "المصروف",
    income: "الدخل",
    maps: "الخرائط",
    monthly: "الرواتب الشهرية",
    percentages: "النسب",
  };

  return (
    <header className="h-16 flex  items-center justify-between px-4 border-b bg-white shadow-sm">
      {/* Left area: page title & breadcrumb */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          {location.pathname !== "/" && (
            <div>
              <BackButton side="right" />
            </div>
          )}

          <nav aria-label="breadcrumb" className="flex items-center gap-2">
            {parts.length === 0 ? (
              <h1 className="text-lg font-semibold text-slate-800">
                <Link to="/">{pageTitle}</Link>
              </h1>
            ) : (
              <ol className="flex items-center gap-2 text-sm text-slate-600">
                {/* Home link */}
                <li className="flex items-center">
                  <Link to="/" className="hover:underline">
                    {segmentNames[""]}
                  </Link>
                  <span className="text-slate-400 mx-1">/</span>
                </li>

                {/* Each segment */}
                {parts.map((seg, idx) => {
                  const path = "/" + parts.slice(0, idx + 1).join("/");
                  const isLast = idx === parts.length - 1;
                  const name = segmentNames[seg] ?? seg.replace(/-/g, " ");

                  return (
                    <li key={path} className="flex items-center">
                      {isLast ? (
                        <span className="text-lg font-semibold text-slate-800">
                          {name}
                        </span>
                      ) : (
                        <>
                          <Link to={path} className="hover:underline">
                            {name}
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
