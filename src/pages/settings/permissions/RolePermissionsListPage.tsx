import { Link } from "react-router-dom";
import { ShieldCheck, Users } from "lucide-react";
import { useJobRoles } from "../../../hooks/permissions/useJobRoles";
import LoadingPage from "../../../components/ui/LoadingPage";
import ErrorPage from "../../../components/ui/errorPage";

// =====================================================================
// Screen 2, list view — implementation guide section 4.2 steps 1-2.
// =====================================================================
// Job-function roles only. Contractor / Vendor / Client are party types
// now, not roles, and are filtered out in useJobRoles — see the note
// there about why this list shows 10 rather than the brief's 13.
//
// This is a NEW page at /settings/permissions/roles. The existing
// /settings/roles page is untouched and still behaves exactly as before,
// because Phase 3 may not change any existing screen's behaviour.
// =====================================================================

export default function RolePermissionsListPage() {
  const { data: roles, isLoading, error } = useJobRoles();

  if (isLoading) return <LoadingPage label="جاري تحميل الأدوار..." />;
  if (error)
    return (
      <ErrorPage
        error={error instanceof Error ? error.message : "خطأ غير معروف"}
        label="خطأ في تحميل الأدوار"
      />
    );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 py-6 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto space-y-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <h1 className="text-xl font-semibold text-gray-900">
            الصلاحيات الأساسية للأدوار
          </h1>
          <p className="text-xs text-gray-600 mt-1">
            صلاحيات الدور يجب أن تكون صحيحة لكل من يشغل هذه الوظيفة. إن كانت
            صحيحة لبعضهم فقط، استخدم قسماً أو استثناءً فردياً بدلاً من ذلك.
          </p>
          <p className="text-[11px] text-gray-400 mt-2">
            «مقاول» و«مورد» و«عميل» غير موجودة هنا — أصبحت أنواع حسابات وليست
            وظائف.
          </p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-3 shadow-sm">
          <ul className="divide-y divide-gray-100">
            {(roles ?? []).map((role) => (
              <li key={role.id}>
                <Link
                  to={`/settings/permissions/roles/${role.id}`}
                  className="flex items-center justify-between gap-3 px-3 py-3 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <span className="flex items-center gap-3">
                    <span className="bg-gray-100 rounded-lg p-2">
                      <ShieldCheck size={16} className="text-gray-500" />
                    </span>
                    <span>
                      <span className="block text-sm font-medium text-gray-900">
                        {role.name}
                      </span>
                      {role.code && (
                        <span
                          className="block text-[11px] text-gray-400"
                          dir="ltr"
                        >
                          {role.code}
                        </span>
                      )}
                    </span>
                  </span>
                  <span className="flex items-center gap-1.5 text-xs text-gray-600">
                    <Users size={14} />
                    {role.holder_count}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
