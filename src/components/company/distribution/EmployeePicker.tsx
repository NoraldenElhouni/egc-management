import React, { useEffect, useState } from "react";
import { useEmployees } from "../../../hooks/useEmployees";
import { formatCurrency } from "../../../utils/helpper";
import { Currency } from "../../../types/global.type";
import { supabase } from "../../../lib/supabaseClient";

interface ProjectRole {
  id: string;
  name: string;
}

interface EmployeePickerProps {
  currency: Currency;
  total: number;
  existingIds: string[];
  onAdd: (
    employeeId: string,
    name: string,
    percentage: number,
    roleId: string,
    roleName: string,
  ) => void;
  onClose: () => void;
}

const EmployeePicker = ({
  currency,
  total,
  existingIds,
  onAdd,
  onClose,
}: EmployeePickerProps) => {
  const { employees, loading } = useEmployees();
  const [selectedId, setSelectedId] = useState("");
  const [percentage, setPercentage] = useState<number | "">("");
  const [query, setQuery] = useState("");

  // ── Role state ────────────────────────────────────────────────────────────
  const [roles, setRoles] = useState<ProjectRole[]>([]);
  const [rolesLoading, setRolesLoading] = useState(false);
  const [selectedRoleId, setSelectedRoleId] = useState("");

  useEffect(() => {
    const fetchRoles = async () => {
      setRolesLoading(true);
      const { data, error } = await supabase
        .from("project_roles")
        .select("id, name")
        .order("name");
      if (!error && data) setRoles(data);
      setRolesLoading(false);
    };
    fetchRoles();
  }, []);

  const available = employees.filter((e) => !existingIds.includes(e.id));

  const handleAdd = () => {
    if (
      !selectedId ||
      percentage === "" ||
      Number(percentage) <= 0 ||
      !selectedRoleId
    )
      return;

    const emp = employees.find((e) => e.id === selectedId);
    if (!emp) return;

    const role = roles.find((r) => r.id === selectedRoleId);
    if (!role) return;

    onAdd(
      selectedId,
      `${emp.first_name} ${emp.last_name ?? ""}`.trim(),
      Number(percentage),
      role.id,
      role.name,
    );
    onClose();
  };

  const filtered = available.filter((emp) => {
    const fullName = `${emp.first_name} ${emp.last_name}`;
    return fullName.toLowerCase().includes(query.toLowerCase());
  });

  const selectedRole = roles.find((r) => r.id === selectedRoleId);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-80 rounded-lg bg-white shadow-xl p-4 space-y-4"
        dir="rtl"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-800">
            إضافة موظف — {currency}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-lg leading-none"
          >
            ✕
          </button>
        </div>

        {/* Search */}
        <input
          type="text"
          placeholder="بحث عن موظف..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full rounded border border-gray-300 px-2 py-1.5 text-right text-xs outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />

        {/* Body */}
        {loading ? (
          <p className="text-xs text-gray-500 text-center py-4">
            جاري التحميل...
          </p>
        ) : available.length === 0 ? (
          <p className="text-xs text-gray-500 text-center py-4">
            لا يوجد موظفون متاحون للإضافة
          </p>
        ) : (
          <>
            {/* Employee list */}
            <div className="max-h-48 overflow-y-auto rounded border divide-y">
              {filtered.map((emp) => (
                <button
                  key={emp.id}
                  type="button"
                  onClick={() => setSelectedId(emp.id)}
                  className={`w-full text-right px-3 py-2 text-xs transition-colors ${
                    selectedId === emp.id
                      ? "bg-blue-50 font-semibold text-blue-700"
                      : "hover:bg-gray-50 text-gray-700"
                  }`}
                >
                  👤 {emp.first_name} {emp.last_name}
                </button>
              ))}
            </div>

            {/* Role picker — shown after selecting an employee */}
            {selectedId && (
              <div className="space-y-1">
                <label className="text-xs text-gray-600 font-medium">
                  الدور في المشروع
                </label>
                {rolesLoading ? (
                  <p className="text-xs text-gray-400">جاري تحميل الأدوار...</p>
                ) : (
                  <select
                    value={selectedRoleId}
                    onChange={(e) => setSelectedRoleId(e.target.value)}
                    className="w-full rounded border border-gray-300 px-2 py-1.5 text-right text-xs outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white"
                  >
                    <option value="">اختر الدور...</option>
                    {roles.map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}

            {/* Percentage input — shown after selecting a role */}
            {selectedId && selectedRoleId && (
              <div className="space-y-1">
                <label className="text-xs text-gray-600 font-medium">
                  النسبة %
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={percentage}
                  onChange={(e) =>
                    setPercentage(
                      e.target.value === "" ? "" : parseFloat(e.target.value),
                    )
                  }
                  placeholder="أدخل النسبة"
                  className="w-full rounded border border-gray-300 px-2 py-1.5 text-right text-xs outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  autoFocus
                />
                {percentage !== "" && total > 0 && (
                  <p className="text-[10px] text-gray-500 tabular-nums">
                    المبلغ:{" "}
                    {formatCurrency(
                      Number(((Number(percentage) / 100) * total).toFixed(2)),
                      currency,
                    )}
                  </p>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={onClose}
                className="rounded px-3 py-1.5 text-xs text-gray-600 border hover:bg-gray-50"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleAdd}
                disabled={
                  !selectedId ||
                  !selectedRoleId ||
                  percentage === "" ||
                  Number(percentage) <= 0
                }
                className="rounded bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-40"
              >
                إضافة
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default EmployeePicker;
