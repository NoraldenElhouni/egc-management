import React from "react";
import { useEmployee } from "../../hooks/useEmployees";
import { useLocation } from "react-router-dom";
import { Edit } from "lucide-react";

// EmployeeDetailsPage.jsx
// React component using Tailwind CSS that reproduces the center "Employee" detail panel
// (no sidebar). Uses static dummy data. Default export a React component.

export default function EmployeeDetailsPage() {
  const location = useLocation();
  const employeeId = location.pathname.split("/").pop() || "";

  const { employee, loading, error } = useEmployee(employeeId);
  const employees = {
    name: "John Williams",
    id: "1210372726433743682",
    gender: "Male",
    email: "johnwilliams@bicaradata.com",
    phone: "081323323311",
    placeOfBirth: "Bandung",
    birthDate: "30 Oct 1994",
    bloodType: "AB",
    maritalStatus: "Married",
    religion: "Christian",
    citizenAddress:
      "Jl. Wayang No.2, Burangrang, Kec. Lengkong, Kota Bandung, Jawa Barat 40262",
    residentialAddress:
      "Jl. Wayang No.2, Burangrang, Kec. Lengkong, Kota Bandung, Jawa Barat 40262",
    emergency: {
      name: "Olivia Bennett",
      relationship: "Wife",
      phone: "081324815250",
    },
    education: [
      {
        degree: "Master Degree - Bina Nusantara",
        field: "Business",
        gpa: "3.5",
        year: "2016 - 2018",
      },
      {
        degree: "Bachelor Degree - Bina Nusantara",
        field: "Business",
        gpa: "3.9",
        year: "2012 - 2016",
      },
    ],
    family: [
      { type: "Father", name: "Benjamin Williams" },
      { type: "Mother", name: "Evelyn Potts" },
      { type: "Siblings", name: "James Williams, Emily Williams" },
    ],
  };

  if (loading) {
    return <div>Loading...</div>;
  }
  if (error || !employee) {
    return <div>Error loading employee data.</div>;
  }

  return (
    <div className="bg-background">
      <div>
        {/* Tabs */}
        <div className="px-6 py-4 border-b">
          <ul className="flex gap-6 text-sm text-gray-600">
            <li className="border-b-2 border-primary pb-2 text-primary">
              Personal info
            </li>
            <li className="pb-2">Employee details</li>
            <li className="pb-2">Payroll details</li>
            <li className="pb-2">Documents</li>
            <li className="pb-2">Payroll history</li>
          </ul>
        </div>

        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-800 mb-4">
              معلومات شخصية
            </h3>

            {/* Basic information card */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6 border">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                {/* Avatar + name */}
                <div className="flex items-center gap-4 col-span-1">
                  <div className="w-28 h-28 rounded-full bg-gradient-to-tr from-primary/10 to-primary/50 flex items-center justify-center text-2xl font-semibold text-foreground">
                    {/* Simple initials avatar */}
                    EM
                  </div>
                  <div>
                    <div className="text-xl font-semibold text-gray-800">
                      {employee?.first_name} {employee?.last_name}
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      {employee.id}
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
                            d="M5.121 17.804A13.937 13.937 0 0112 15c2.761 0 5.313.85 7.379 2.304M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                        <span>{employees.gender}</span>
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
                            d="M16 12H8m0 0l3-3m-3 3l3 3"
                          />
                        </svg>
                        <span>{employee.email}</span>
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
                            d="M3 5h2l.4 2M7 13h10l4-8H5.4M7 13l-1.2 6.1a2 2 0 002 2.4h8.4a2 2 0 002-2.4L17 13M7 13h10"
                          />
                        </svg>
                        <span>{employee.phone_number}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Vertical divider on md and details on right */}
                <div className="hidden md:block md:col-span-1 border-l" />

                <div className="col-span-1 md:col-span-1">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-700">
                    <div className="space-y-2">
                      <div className="text-xs text-gray-400">
                        Place of birth
                      </div>
                      <div>{employees.placeOfBirth}</div>

                      <div className="mt-3 text-xs text-gray-400">
                        Birth date
                      </div>
                      <div>{employees.birthDate}</div>

                      <div className="mt-3 text-xs text-gray-400">
                        Blood type
                      </div>
                      <div>{employees.bloodType}</div>
                    </div>

                    <div className="space-y-2">
                      <div className="text-xs text-gray-400">
                        Marital Status
                      </div>
                      <div>{employees.maritalStatus}</div>

                      <div className="mt-3 text-xs text-gray-400">Religion</div>
                      <div>{employees.religion}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Grid with Address, Emergency, Education, Family */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                {/* Address card */}
                <div className="bg-white rounded-lg shadow-sm p-6 border">
                  <div className="flex justify-between items-start">
                    <h4 className="text-md font-medium text-gray-800">
                      Address
                    </h4>
                    <button className="text-gray-400 hover:text-gray-600">
                      <Edit className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
                    <div>
                      <div className="text-xs text-gray-400">
                        Citizen ID address
                      </div>
                      <div className="mt-1">{employees.citizenAddress}</div>
                    </div>

                    <div>
                      <div className="text-xs text-gray-400">
                        Residential address
                      </div>
                      <div className="mt-1">{employees.residentialAddress}</div>
                    </div>
                  </div>
                </div>

                {/* Education card */}
                <div className="bg-white rounded-lg shadow-sm p-6 border">
                  <div className="flex justify-between items-start">
                    <h4 className="text-md font-medium text-gray-800">
                      Education
                    </h4>
                    <button className="text-gray-400 hover:text-gray-600">
                      <Edit className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="mt-4 space-y-4 text-sm text-gray-700">
                    {employees.education.map((ed, idx) => (
                      <div key={idx} className="p-4 bg-gray-50 rounded-md">
                        <div className="font-semibold">{ed.degree}</div>
                        <div className="text-xs text-gray-500">{ed.field}</div>
                        <div className="text-xs text-gray-500 mt-2">
                          GPA ({ed.gpa}) • {ed.year}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                {/* Emergency contact */}
                <div className="bg-white rounded-lg shadow-sm p-6 border">
                  <div className="flex justify-between items-start">
                    <h4 className="text-md font-medium text-gray-800">
                      Emergency contact
                    </h4>
                    <button className="text-gray-400 hover:text-gray-600">
                      <Edit className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="mt-4 text-sm text-gray-700">
                    <div className="text-xs text-gray-400">Name</div>
                    <div className="mt-1">{employees.emergency.name}</div>

                    <div className="mt-3 text-xs text-gray-400">
                      Relationship
                    </div>
                    <div className="mt-1">
                      {employees.emergency.relationship}
                    </div>

                    <div className="mt-3 text-xs text-gray-400">
                      Phone number
                    </div>
                    <div className="mt-1">{employees.emergency.phone}</div>
                  </div>
                </div>

                {/* Family card */}
                <div className="bg-white rounded-lg shadow-sm p-6 border">
                  <div className="flex justify-between items-start">
                    <h4 className="text-md font-medium text-gray-800">
                      Family
                    </h4>
                    <button className="text-gray-400 hover:text-gray-600">
                      <Edit className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="mt-4 text-sm text-gray-700">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="text-xs text-gray-400">
                          <th className="pb-2">Family type</th>
                          <th className="pb-2">Person name</th>
                        </tr>
                      </thead>
                      <tbody>
                        {employees.family.map((f, i) => (
                          <tr key={i} className="border-t">
                            <td className="py-2">{f.type}</td>
                            <td className="py-2">{f.name}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
