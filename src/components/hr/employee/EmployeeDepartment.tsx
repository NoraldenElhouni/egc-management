import { useEffect, useState } from "react";
import { useCan } from "../../../hooks/permissions/useCan";
import {
  useDepartments,
  useEmployeeDepartment,
  useSetEmployeeDepartment,
} from "../../../hooks/permissions/useDepartments";

interface EmployeeDepartmentProps {
  employeeId: string;
}

// =====================================================================
// Department, editable from the employee's own page.
// =====================================================================
// Previously only settable at creation (NewEmployeeForm) or from the
// department's own Members tab (DepartmentMembersTab). Same underlying
// mutation as both of those — useSetEmployeeDepartment — so this stays
// one write path: one department per person, and the permission caches
// it depends on (effective-permissions, inherited-grants) get
// invalidated the same way regardless of which screen made the change.
// =====================================================================

const EmployeeDepartment = ({ employeeId }: EmployeeDepartmentProps) => {
  const { can: canEdit, loading: checkingPermission } =
    useCan("manage_departments");
  const { data: departments = [], isPending: departmentsLoading } =
    useDepartments();
  const { data: currentDepartment, isLoading: currentLoading } =
    useEmployeeDepartment(employeeId);
  const setDepartment = useSetEmployeeDepartment();

  const [selected, setSelected] = useState<string>("");

  useEffect(() => {
    setSelected(currentDepartment?.id ?? "");
  }, [currentDepartment?.id]);

  const handleChange = async (value: string) => {
    setSelected(value);
    await setDepartment.mutateAsync({
      employeeId,
      departmentId: value || null,
    });
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm space-y-4">
      <h2 className="text-lg font-semibold text-gray-800">القسم</h2>

      <div className="text-sm text-gray-600">
        القسم الحالي:{" "}
        <span className="font-semibold text-primary">
          {currentLoading ? "..." : (currentDepartment?.name ?? "بدون قسم")}
        </span>
      </div>

      {checkingPermission ? (
        <p className="text-sm text-gray-400">جاري التحقق من الصلاحية...</p>
      ) : canEdit ? (
        <div className="space-y-2">
          <label className="text-sm text-gray-600">تغيير القسم</label>

          <select
            className="w-full border rounded p-2"
            value={selected}
            disabled={departmentsLoading || setDepartment.isPending}
            onChange={(e) => handleChange(e.target.value)}
          >
            <option value="">بدون قسم</option>
            {departments.map((department) => (
              <option key={department.id} value={department.id}>
                {department.name_ar || department.name}
              </option>
            ))}
          </select>

          {setDepartment.isPending && (
            <p className="text-xs text-gray-500">جاري تحديث القسم...</p>
          )}
        </div>
      ) : (
        <p className="text-sm text-gray-400">لا يمكنك تعديل هذا الحقل</p>
      )}
    </div>
  );
};

export default EmployeeDepartment;
