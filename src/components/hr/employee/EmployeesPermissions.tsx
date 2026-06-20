import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";
import { FullEmployee } from "../../../types/extended.type";
import { useAuth } from "../../../hooks/useAuth";

interface Permission {
  id: string;
  name: string;
  type: string;
  parent_permission_id: string | null;
}

interface UserPermission {
  permission_id: string;
  allowed: boolean;
}

interface EmployeeRoleProps {
  employee: FullEmployee;
  onUpdated?: () => void | Promise<void>;
}

const EmployeesPermissions = ({ employee, onUpdated }: EmployeeRoleProps) => {
  const { user } = useAuth();

  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [userPermissions, setUserPermissions] = useState<UserPermission[]>([]);
  const [rolePermissionIds, setRolePermissionIds] = useState<Set<string>>(
    new Set(),
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  const canEdit = user?.role === "Admin" || user?.role === "Manager";

  // -----------------------------------------
  // Fetch all permissions + user's overrides
  // + role-level permissions
  // -----------------------------------------
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      // 1. All permissions
      const { data: permsData, error: permsError } = await supabase
        .from("permissions")
        .select("id, name, type, parent_permission_id")
        .neq("type", "project")
        .order("type")
        .order("name");

      if (permsError) {
        console.error(permsError);
        setLoading(false);
        return;
      }

      // 2. User-level permission overrides
      const { data: userPermsData, error: userPermsError } = await supabase
        .from("user_permissions")
        .select("permission_id, allowed")
        .eq("user_id", employee.id);

      if (userPermsError) {
        console.error(userPermsError);
      }

      // 3. Role-level permissions (inherited)
      const { data: rolePermsData, error: rolePermsError } = await supabase
        .from("role_permissions")
        .select("permission_id")
        .eq("role_id", employee.user_role?.role_id ?? "");

      if (rolePermsError) {
        console.error(rolePermsError);
      }

      setAllPermissions(permsData || []);
      setUserPermissions(userPermsData || []);
      setRolePermissionIds(
        new Set((rolePermsData || []).map((rp) => rp.permission_id)),
      );
      setLoading(false);
    };

    fetchData();
  }, [employee.id, employee.user_role?.role_id]);

  // -----------------------------------------
  // Resolve effective permission state
  // -----------------------------------------
  const getEffectiveState = (
    permissionId: string,
  ): { allowed: boolean; source: "user" | "role" | "none" } => {
    const userOverride = userPermissions.find(
      (up) => up.permission_id === permissionId,
    );
    if (userOverride !== undefined) {
      return { allowed: userOverride.allowed, source: "user" };
    }
    if (rolePermissionIds.has(permissionId)) {
      return { allowed: true, source: "role" };
    }
    return { allowed: false, source: "none" };
  };

  // -----------------------------------------
  // Toggle a permission (upsert user_permissions)
  // -----------------------------------------
  const handleToggle = async (
    permissionId: string,
    currentAllowed: boolean,
  ) => {
    if (!canEdit) return;

    setSaving(permissionId);

    const newAllowed = !currentAllowed;

    const { error } = await supabase.from("user_permissions").upsert(
      {
        user_id: employee.id,
        permission_id: permissionId,
        allowed: newAllowed,
      },
      { onConflict: "user_id,permission_id" },
    );

    if (error) {
      console.error(error);
      setSaving(null);
      return;
    }

    // Update local state
    setUserPermissions((prev) => {
      const exists = prev.find((up) => up.permission_id === permissionId);
      if (exists) {
        return prev.map((up) =>
          up.permission_id === permissionId
            ? { ...up, allowed: newAllowed }
            : up,
        );
      }
      return [...prev, { permission_id: permissionId, allowed: newAllowed }];
    });

    setSaving(null);
    await onUpdated?.();
  };

  // -----------------------------------------
  // Reset a user override (remove row)
  // -----------------------------------------
  const handleReset = async (permissionId: string) => {
    if (!canEdit) return;

    setSaving(permissionId);

    const { error } = await supabase
      .from("user_permissions")
      .delete()
      .eq("user_id", employee.id)
      .eq("permission_id", permissionId);

    if (error) {
      console.error(error);
      setSaving(null);
      return;
    }

    setUserPermissions((prev) =>
      prev.filter((up) => up.permission_id !== permissionId),
    );

    setSaving(null);
    await onUpdated?.();
  };

  // -----------------------------------------
  // Group permissions by type
  // -----------------------------------------
  const grouped = allPermissions.reduce<Record<string, Permission[]>>(
    (acc, perm) => {
      const key = perm.type || "other";
      if (!acc[key]) acc[key] = [];
      acc[key].push(perm);
      return acc;
    },
    {},
  );

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <p className="text-sm text-gray-500">جاري تحميل الصلاحيات...</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800">
          إدارة صلاحيات الموظف
        </h2>
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-3 rounded-full bg-primary" />
            مخصص للمستخدم
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-3 rounded-full bg-blue-400" />
            موروث من الدور
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-3 rounded-full bg-gray-200" />
            غير ممنوح
          </span>
        </div>
      </div>

      {!canEdit && (
        <p className="text-sm text-gray-400">لا يمكنك تعديل هذا الحقل</p>
      )}

      {Object.entries(grouped).map(([type, permissions]) => (
        <div key={type}>
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3 border-b pb-1">
            {type}
          </h3>
          <div className="space-y-2">
            {permissions.map((perm) => {
              const { allowed, source } = getEffectiveState(perm.id);
              const isSaving = saving === perm.id;
              const hasUserOverride = source === "user";

              return (
                <div
                  key={perm.id}
                  className="flex items-center justify-between py-2 px-3 rounded-md hover:bg-gray-50 transition-colors"
                >
                  <div className="flex flex-col">
                    <span className="text-sm text-gray-800">{perm.name}</span>
                    {source === "role" && !hasUserOverride && (
                      <span className="text-xs text-blue-400">
                        موروث من الدور
                      </span>
                    )}
                    {hasUserOverride && (
                      <span className="text-xs text-primary">
                        مخصص للمستخدم
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Reset override button */}
                    {hasUserOverride && canEdit && (
                      <button
                        onClick={() => handleReset(perm.id)}
                        disabled={isSaving}
                        className="text-xs text-gray-400 hover:text-red-500 transition-colors underline"
                        title="إعادة تعيين للدور الافتراضي"
                      >
                        إعادة تعيين
                      </button>
                    )}

                    {/* Toggle switch */}
                    <button
                      dir="ltr"
                      role="switch"
                      aria-checked={allowed}
                      disabled={!canEdit || isSaving}
                      onClick={() => handleToggle(perm.id, allowed)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 ${
                        allowed
                          ? source === "user"
                            ? "bg-primary"
                            : "bg-blue-400"
                          : "bg-gray-200"
                      } ${!canEdit ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          allowed ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {allPermissions.length === 0 && (
        <p className="text-sm text-gray-400 text-center py-4">
          لا توجد صلاحيات متاحة
        </p>
      )}
    </div>
  );
};

export default EmployeesPermissions;
