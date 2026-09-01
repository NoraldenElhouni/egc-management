import { useMemo, useState } from "react";
import { Search, UserMinus, UserPlus } from "lucide-react";
import {
  useAssignableStaff,
  useDepartmentMembers,
  useSetEmployeeDepartment,
} from "../../hooks/permissions/useDepartments";
import Button from "../ui/Button";

// =====================================================================
// Members tab — implementation guide section 4.1 step 8.
// =====================================================================
// One department per person (guide section 7, decision 2). Adding
// someone who is already in another department MOVES them, and the UI
// says so before it happens rather than after.
// =====================================================================

interface Props {
  departmentId: string;
}

export default function DepartmentMembersTab({ departmentId }: Props) {
  const { data: members, isLoading } = useDepartmentMembers(departmentId);
  const { data: staff } = useAssignableStaff();
  const setDepartment = useSetEmployeeDepartment();

  const [search, setSearch] = useState("");
  const [pendingId, setPendingId] = useState<string | null>(null);

  const candidates = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (staff ?? [])
      .filter((person) => person.department_id !== departmentId)
      .filter(
        (person) =>
          term === "" ||
          person.full_name.toLowerCase().includes(term) ||
          (person.email ?? "").toLowerCase().includes(term),
      )
      .slice(0, 25);
  }, [staff, search, departmentId]);

  const assign = async (employeeId: string, departmentIdOrNull: string | null) => {
    setPendingId(employeeId);
    try {
      await setDepartment.mutateAsync({
        employeeId,
        departmentId: departmentIdOrNull,
      });
    } finally {
      setPendingId(null);
    }
  };

  return (
    <div className="space-y-5">
      {/* Current members */}
      <div>
        <h3 className="text-sm font-semibold text-gray-800 mb-2">
          أعضاء القسم
        </h3>
        {isLoading ? (
          <p className="text-sm text-gray-500">جاري التحميل...</p>
        ) : (members ?? []).length === 0 ? (
          <p className="text-sm text-gray-500 border border-dashed border-gray-300 rounded-lg p-6 text-center">
            لا يوجد أعضاء في هذا القسم بعد. القسم الفارغ حالة طبيعية.
          </p>
        ) : (
          <ul className="divide-y divide-gray-100 border border-gray-200 rounded-lg">
            {(members ?? []).map((member) => (
              <li
                key={member.id}
                className="flex items-center justify-between gap-3 px-3 py-2"
              >
                <span>
                  <span className="block text-sm text-gray-900">
                    {member.full_name}
                  </span>
                  <span className="block text-[11px] text-gray-400" dir="ltr">
                    {member.email}
                  </span>
                </span>
                <Button
                  variant="ghost"
                  size="xs"
                  loading={pendingId === member.id}
                  onClick={() => assign(member.id, null)}
                >
                  <UserMinus size={13} className="ml-1" />
                  إزالة
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Add */}
      <div>
        <h3 className="text-sm font-semibold text-gray-800 mb-2">
          إضافة عضو
        </h3>
        <div className="relative mb-2">
          <Search
            size={15}
            className="absolute top-1/2 -translate-y-1/2 right-3 text-gray-400"
          />
          <input
            dir="rtl"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث بالاسم أو البريد..."
            className="w-full border border-gray-200 rounded-lg py-2 pr-9 pl-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {candidates.length === 0 ? (
          <p className="text-sm text-gray-500">لا توجد نتائج.</p>
        ) : (
          <ul className="divide-y divide-gray-100 border border-gray-200 rounded-lg max-h-72 overflow-y-auto">
            {candidates.map((person) => (
              <li
                key={person.id}
                className="flex items-center justify-between gap-3 px-3 py-2"
              >
                <span>
                  <span className="block text-sm text-gray-900">
                    {person.full_name}
                  </span>
                  <span className="block text-[11px] text-gray-400">
                    {person.current_department_name ? (
                      <span className="text-amber-600">
                        حالياً في قسم {person.current_department_name} — سيتم
                        نقله
                      </span>
                    ) : (
                      "بدون قسم"
                    )}
                  </span>
                </span>
                <Button
                  variant="primary-light"
                  size="xs"
                  loading={pendingId === person.id}
                  onClick={() => assign(person.id, departmentId)}
                >
                  <UserPlus size={13} className="ml-1" />
                  إضافة
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
