import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";
import { FullEmployee } from "../../../types/extended.type";
import { useAuth } from "../../../hooks/useAuth";

interface Role {
  id: string;
  name: string;
  code: string;
}

interface EmployeeRoleProps {
  employee: FullEmployee;
  onUpdated?: () => void | Promise<void>;
}

const EmployeeRole = ({ employee, onUpdated }: EmployeeRoleProps) => {
  const { user } = useAuth();

  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedRole, setSelectedRole] = useState(employee.user_role?.role_id);
  const [loading, setLoading] = useState(false);

  const canEdit = user?.role === "Admin" || user?.role === "Manager";

  // -----------------------------
  // Fetch roles
  // -----------------------------
  useEffect(() => {
    const fetchRoles = async () => {
      const { data, error } = await supabase
        .from("roles")
        .select("id, name, code");

      if (error) {
        console.error(error);
        return;
      }

      setRoles(data || []);
    };

    fetchRoles();
  }, []);

  // -----------------------------
  // Update role
  // -----------------------------
  const handleChangeRole = async (roleId: string) => {
    if (!canEdit) return;

    setLoading(true);

    const { error } = await supabase
      .from("users")
      .update({ role_id: roleId })
      .eq("id", employee.id);

    const { error: roleError } = await supabase
      .from("user_roles")
      .update({ role_id: roleId })
      .eq("user_id", employee.id);

    setLoading(false);

    if (error) {
      console.error(error);
      return;
    }
    if (roleError) {
      console.error(roleError);
      return;
    }

    setSelectedRole(roleId);
    await onUpdated?.();
  };

  const currentRole = roles.find((r) => r.id === selectedRole);

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm space-y-4">
      <h2 className="text-lg font-semibold text-gray-800">إدارة دور الموظف</h2>

      {/* Current role display */}
      <div className="text-sm text-gray-600">
        الدور الحالي:{" "}
        <span className="font-semibold text-primary">
          {currentRole?.name || "غير محدد"}
        </span>
      </div>

      {/* Only admin/manager can edit */}
      {canEdit ? (
        <div className="space-y-2">
          <label className="text-sm text-gray-600">تغيير الدور</label>

          <select
            className="w-full border rounded p-2"
            value={selectedRole}
            disabled={loading}
            onChange={(e) => handleChangeRole(e.target.value)}
          >
            {roles.map((role) => (
              <option key={role.id} value={role.id}>
                {role.name}
              </option>
            ))}
          </select>

          {loading && (
            <p className="text-xs text-gray-500">جاري تحديث الدور...</p>
          )}
        </div>
      ) : (
        <p className="text-sm text-gray-400">لا يمكنك تعديل هذا الحقل</p>
      )}
    </div>
  );
};

export default EmployeeRole;
