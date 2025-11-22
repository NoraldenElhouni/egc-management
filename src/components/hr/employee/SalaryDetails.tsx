import React from "react";

type SalaryRecord = {
  token: string;
  employeeName: string;
  status: "Paid" | "Pending";
  timeTaken: string; // e.g. "3 days", "2 hours"
  amount: number;
  paidAt?: string;
};

const dummySalaries: SalaryRecord[] = [
  {
    token: "SAL-20251122-001",
    employeeName: "أحمد محمد",
    status: "Paid",
    timeTaken: "3 days",
    amount: 1200,
    paidAt: "2025-11-20",
  },
  {
    token: "SAL-20251122-002",
    employeeName: "سارة علي",
    status: "Pending",
    timeTaken: "1 day",
    amount: 1550,
  },
  {
    token: "SAL-20251122-003",
    employeeName: "خالد حسن",
    status: "Paid",
    timeTaken: "5 hours",
    amount: 980,
    paidAt: "2025-11-21",
  },
  {
    token: "SAL-20251122-004",
    employeeName: "منى عباس",
    status: "Pending",
    timeTaken: "2 days",
    amount: 2100,
  },
];

const SalaryDetails = ({ employeeName }: { employeeName?: string }) => {
  const records = employeeName
    ? dummySalaries.filter((s) => s.employeeName === employeeName)
    : dummySalaries;

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-medium text-gray-800 mb-4">
        {employeeName ? `رواتب الموظف — ${employeeName}` : "تفاصيل الرواتب"}
      </h3>

      <div className="overflow-x-auto">
        {records.length === 0 ? (
          <div className="text-gray-500">لا توجد سجلات رواتب لهذا الموظف.</div>
        ) : (
          <table className="w-full text-sm text-right">
            <thead>
              <tr className="text-xs text-gray-500 uppercase bg-gray-50">
                <th className="py-3 px-3">توكن</th>
                <th className="py-3 px-3">الحالة</th>
                <th className="py-3 px-3">المبلغ</th>
              </tr>
            </thead>
            <tbody>
              {records.map((s) => (
                <tr key={s.token} className="border-t">
                  <td className="py-3 px-3 align-middle">{s.token}</td>
                  <td className="py-3 px-3 align-middle">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        s.status === "Paid"
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {s.status}
                    </span>
                  </td>
                  <td className="py-3 px-3 align-middle">
                    {s.amount.toLocaleString()} LYD
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default SalaryDetails;
