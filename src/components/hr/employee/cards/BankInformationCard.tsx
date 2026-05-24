import React, { useEffect, useMemo, useState } from "react";
import { FullEmployee } from "../../../../types/extended.type";
import { Edit } from "lucide-react";

export type BankValues = Pick<
  FullEmployee,
  "bank_name" | "bank_account_number"
>;
interface BankInformationCardProps {
  employee: FullEmployee;
  onSave?: (data: BankValues) => Promise<void> | void;
}

const BankInformationCard = ({
  employee,
  onSave,
}: BankInformationCardProps) => {
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);

  const initialValues = useMemo<BankValues>(
    () => ({
      bank_name: employee.bank_name ?? null,
      bank_account_number: employee.bank_account_number,
    }),
    [employee.bank_name, employee.bank_account_number],
  );
  const [formData, setFormData] = useState<BankValues>(initialValues);

  useEffect(() => {
    setFormData(initialValues);
  }, [initialValues]);

  const updateField = <K extends keyof BankValues>(
    key: K,
    value: BankValues[K],
  ) => {
    setFormData((s) => ({ ...s, [key]: value }));
  };

  const handleCancel = () => {
    setFormData(initialValues);
    setEditMode(false);
  };

  const handleSave = async () => {
    if (!onSave) {
      setEditMode(false);
      return;
    }

    try {
      setSaving(true);
      await onSave(formData); // ✅ await update + refetch
      setEditMode(false); // ✅ close only after success
    } finally {
      setSaving(false);
    }
  };
  return (
    <div className="bg-white rounded-lg shadow-sm p-6 border">
      <div className="flex justify-between items-start">
        <h4 className="text-md font-medium text-gray-800">المعلومات البنكية</h4>

        {!editMode ? (
          <button
            className="text-gray-400 hover:text-gray-600"
            onClick={() => setEditMode(true)}
            aria-label="Edit bank information"
          >
            <Edit className="h-4 w-4" />
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button
              className="px-3 py-1 rounded-md bg-green-600 text-white text-sm disabled:opacity-50"
              disabled={saving}
              onClick={handleSave}
              type="button"
            >
              {saving ? "..." : "حفظ"}
            </button>

            <button
              className="px-3 py-1 rounded-md bg-gray-100 text-sm disabled:opacity-50"
              disabled={saving}
              onClick={handleCancel}
              type="button"
            >
              إلغاء
            </button>
          </div>
        )}
      </div>

      <div className="mt-4 text-sm text-gray-700">
        {/* Bank Name */}
        <div className="text-xs text-gray-400">اسم البنك</div>

        {editMode ? (
          <input
            className="mt-1 w-full border rounded px-2 py-1 text-sm"
            value={formData.bank_name ?? ""}
            onChange={(e) => updateField("bank_name", e.target.value)}
            disabled={saving}
            placeholder="أدخل اسم البنك"
          />
        ) : (
          <div className="mt-1">{employee.bank_name ?? "غير محدد"}</div>
        )}

        {/* Account Number */}
        <div className="mt-3 text-xs text-gray-400">رقم الحساب البنكي</div>

        {editMode ? (
          <input
            className="mt-1 w-full border rounded px-2 py-1 text-sm"
            value={formData.bank_account_number ?? ""}
            onChange={(e) => updateField("bank_account_number", e.target.value)}
            disabled={saving}
            placeholder="أدخل رقم الحساب"
          />
        ) : (
          <div className="mt-1">
            {employee.bank_account_number ?? "غير محدد"}
          </div>
        )}
      </div>
    </div>
  );
};

export default BankInformationCard;
