import React from "react";
import { useLocation } from "react-router-dom";
import { useEmployee } from "../../../hooks/useEmployees";
import { Edit } from "lucide-react";

const PersonalInfo = () => {
  const location = useLocation();
  const employeeId = location.pathname.split("/").pop() || "";

  const { employee, loading, error } = useEmployee(employeeId);

  if (loading) return <div>جاري التحميل...</div>;
  if (error || !employee) return <div>خطأ في تحميل بيانات الموظف.</div>;

  // Dummy data fully aligned with userSchema
  const employees = {
    id: "1210372726433743682",
    firstName: "محمد",
    lastName: "علي",
    gender: "ذكر",
    dob: "1994-10-30",
    placeOfBirth: "بنغازي",
    bloodType: "AB+",
    maritalStatus: "اعزب",
    nationality: "ليبي",
    email: "john.williams@bicaradata.com",
    personalEmail: "john.personal@gmail.com",
    phone: "09211223344",
    alternatePhone: "09176543211",
    address: "123 شارع دبي بنغازي ليبيا",
    emergencyContact: "نورالدين الهوني",
    emergencyContactPhone: "0923111438",
    emergencyContactRelation: "صديق",
    employeeType: "full-time",
    jobTitle: "مهندس برمجيات",
    department: "تكنولوجيا المعلومات",
    dateOfJoining: "2018-01-10",
    managerId: "998877665544332211",
    status: "Active",
    role: "Manager",
    salaryType: "fixed",
    baseSalary: 15000000,
    bankName: "بنك ليبيا المركزي",
    bankAccountNumber: "1234567890",
    highestQualification: "بكالوريوس في علوم الحاسوب",
    university: "جامعة بنغازي",
    graduationYear: 2018,
    gpa: 3.5,
    certifications: ["AWS Certified Developer", "Scrum Master"],
    previousCompanyName: "Tech Solutions Ltd",
    previousJobTitle: "Junior Developer",
    yearsOfExperience: 5,
    resumeUrl: "https://example.com/resume.pdf",
    personalPhotoUrl: "https://example.com/photo.jpg",
    idProofUrl: "https://example.com/id.pdf",
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
  };
  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="p-6">
        <h3 className="text-lg font-medium text-gray-800 mb-4">
          المعلومات الشخصية
        </h3>

        {/* Basic information card */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6 border">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            {/* Avatar + name */}
            <div className="flex items-center gap-4 col-span-1">
              <div className="w-28 h-28 rounded-full bg-gradient-to-tr from-primary/10 to-primary/50 flex items-center justify-center text-2xl font-semibold text-foreground">
                {/* Initials */}
                {employee.first_name?.[0] ?? ""}
                {employee.last_name?.[0] ?? ""}
              </div>
              <div>
                <div className="text-xl font-semibold text-gray-800">
                  {employee.first_name} {employee.last_name}
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  {employee.id.slice(0, 13)}
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
                  <div className="text-xs text-gray-400">مكان الميلاد</div>
                  <div>{employees.placeOfBirth}</div>

                  <div className="mt-3 text-xs text-gray-400">
                    تاريخ الميلاد
                  </div>
                  <div>{employees.dob}</div>

                  <div className="mt-3 text-xs text-gray-400">فصيلة الدم</div>
                  <div>{employees.bloodType}</div>
                </div>

                <div className="space-y-2">
                  <div className="text-xs text-gray-400">الحالة الاجتماعية</div>
                  <div>{employees.maritalStatus}</div>

                  <div className="mt-3 text-xs text-gray-400">الجنسية</div>
                  <div>{employees.nationality}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Address & Emergency & Education */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Address card */}
            <div className="bg-white rounded-lg shadow-sm p-6 border">
              <div className="flex justify-between items-start">
                <h4 className="text-md font-medium text-gray-800">العنوان</h4>
                <button className="text-gray-400 hover:text-gray-600">
                  <Edit className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
                <div>
                  <div className="text-xs text-gray-400">العنوان</div>
                  <div className="mt-1">{employees.address}</div>
                </div>
              </div>
            </div>

            {/* Education card */}
            <div className="bg-white rounded-lg shadow-sm p-6 border">
              <div className="flex justify-between items-start">
                <h4 className="text-md font-medium text-gray-800">التعليم</h4>
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

          {/* Emergency contact card */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6 border">
              <div className="flex justify-between items-start">
                <h4 className="text-md font-medium text-gray-800">
                  جهة الاتصال في حالة الطوارئ
                </h4>
                <button className="text-gray-400 hover:text-gray-600">
                  <Edit className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-4 text-sm text-gray-700">
                <div className="text-xs text-gray-400">الاسم</div>
                <div className="mt-1">{employees.emergencyContact}</div>

                <div className="mt-3 text-xs text-gray-400">العلاقة</div>
                <div className="mt-1">{employees.emergencyContactRelation}</div>

                <div className="mt-3 text-xs text-gray-400">رقم الهاتف</div>
                <div className="mt-1">{employees.emergencyContactPhone}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PersonalInfo;
