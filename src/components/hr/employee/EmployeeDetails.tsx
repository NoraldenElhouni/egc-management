import { Edit } from "lucide-react";
import { fullEmployee } from "../../../types/extended.type";
import { formatDate } from "../../../utils/helpper";

interface EmployeeDetailsProps {
  employee: fullEmployee;
}

const EmployeeDetails = ({ employee }: EmployeeDetailsProps) => {
  const derivedProjects = [
    {
      id: "proj1",
      name: "مشروع تطوير الويب",
      code: "WEB-01",
      role: "مطور أمامي",
      status: "نشط",
      assigned_at:
        employee.date_of_joining ??
        employee.created_at ??
        new Date().toISOString(),
    },
  ];
  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-lg font-medium text-gray-800">تفاصيل الموظف</h3>
          <button className="text-gray-400 hover:text-gray-600">
            <Edit className="h-4 w-4" />
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 mb-6 border">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            <div className="flex items-center gap-4 col-span-1 md:col-span-2">
              <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-primary/10 to-primary/50 flex items-center justify-center text-2xl font-semibold text-foreground">
                {(employee.first_name?.[0] ?? "") +
                  (employee.last_name?.[0] ?? "")}
              </div>
              <div>
                <div className="text-xl font-semibold text-gray-800">
                  {employee.first_name ?? "غير محدد"} {employee.last_name ?? ""}
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  {employee.employee_id ?? employee.id ?? "N/A"}
                </div>

                <div className="mt-3 flex flex-wrap gap-3 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 11c2.761 0 5-2.239 5-5S14.761 1 12 1 7 3.239 7 6s2.239 5 5 5z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M21 21l-4.35-4.35"
                      />
                    </svg>
                    <span>{employee.job_title ?? "غير محدد"}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M3 7v13h18V7M16 3v4M8 3v4h8V3"
                      />
                    </svg>
                    <span>ENG</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 8v4l3 3"
                      />
                    </svg>
                    <span>{employee.status ?? "غير محدد"}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-span-1">
              <div className="text-sm text-gray-700 space-y-3">
                <div>
                  <div className="text-xs text-gray-400">تاريخ الانضمام</div>
                  <div className="mt-1">
                    {formatDate(
                      employee.date_of_joining ?? employee.created_at
                    )}
                  </div>
                </div>

                <div>
                  <div className="text-xs text-gray-400">المدير المباشر</div>
                  <div className="mt-1">غير محدد</div>
                </div>

                <div>
                  <div className="text-xs text-gray-400">نوع التوظيف</div>
                  <div className="mt-1">
                    {employee.employee_type ?? "غير محدد"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Projects / Assignments */}
        <div className="bg-white rounded-lg shadow-sm p-6 border">
          <div className="flex justify-between items-start">
            <h4 className="text-md font-medium text-gray-800">
              المشاريع الحالية
            </h4>
            <button className="text-gray-400 hover:text-gray-600">
              <Edit className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-4 space-y-3 text-sm text-gray-700">
            {derivedProjects.length > 0 ? (
              derivedProjects.map((p) => (
                <div
                  key={p.id}
                  className="p-4 bg-gray-50 rounded-md flex justify-between items-center"
                >
                  <div>
                    <div className="font-semibold">{p.name}</div>
                    <div className="text-xs text-gray-500">
                      {p.code ? `${p.code} • ` : ""}
                      {p.role ? `${p.role} • ` : ""}
                      {p.status ? `${p.status}` : ""}
                    </div>
                  </div>

                  <div className="text-xs text-gray-500 text-right">
                    <div>تعيين: {formatDate(p.assigned_at)}</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-gray-400">لا يوجد مشاريع حالية</div>
            )}
          </div>
        </div>

        {/* Optional: quick stats */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-md border text-center">
            <div className="text-xs text-gray-400">عدد المشاريع</div>
            <div className="font-semibold text-gray-800 mt-1">
              {derivedProjects.length}
            </div>
          </div>

          <div className="bg-white p-4 rounded-md border text-center">
            <div className="text-xs text-gray-400">الراتب الأساسي</div>
            <div className="font-semibold text-gray-800 mt-1">
              {employee.base_salary ? `${employee.base_salary}` : "غير محدد"}
            </div>
          </div>

          <div className="bg-white p-4 rounded-md border text-center">
            <div className="text-xs text-gray-400">الجنسية</div>
            <div className="font-semibold text-gray-800 mt-1">
              {employee.nationality ?? "غير محدد"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDetails;
