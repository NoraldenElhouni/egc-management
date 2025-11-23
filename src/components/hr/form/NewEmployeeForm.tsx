import React, { useState } from "react";
import Button from "../../ui/Button";
import { userSchema, UserFormValues } from "../../../types/schema/users.schema";
import { useForm } from "react-hook-form";
import type { Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { TextField } from "../../ui/inputs/TextField";
import { PasswordField } from "../../ui/inputs/PasswordField";
import { SelectField } from "../../ui/inputs/SelectField";
import { DateField } from "../../ui/inputs/DateField";
import { NumberField } from "../../ui/inputs/NumberField";
import { createEmployee } from "../../../services/employees/setEmployeeService";

const NewEmployeeForm: React.FC = () => {
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    trigger,
    setFocus,
    reset,
  } = useForm<UserFormValues>({
    resolver: zodResolver(userSchema) as unknown as Resolver<UserFormValues>,
    defaultValues: {
      employeeType: "Full-Time",
      role: "Support",
      salaryType: "fixed",
      status: "Active",
    },
  });

  const onSubmit = async (data: UserFormValues) => {
    setLoading(true);
    try {
      const response = await createEmployee(data);
      if (!response.success) {
        alert("خطأ في إنشاء الموظف: " + response.message);
        throw new Error(response.message);
      }
      setSuccess("تم اضافة الموظف بنجاح");
      reset();
    } catch (error) {
      console.error("Unexpected error creating employee:", error);
      alert("حدث خطأ غير متوقع أثناء إنشاء الموظف.");
    } finally {
      setLoading(false);
    }
  };

  const employeeTypeOptions = [
    { value: "Full-Time", label: "Full-Time" },
    { value: "Part-Time", label: "Part-Time" },
    { value: "Contractor", label: "Contractor" },
    { value: "Intern", label: "Intern" },
  ];

  const roleOptions = [
    { value: "Admin", label: "Admin" },
    { value: "Manager", label: "Manager" },
    { value: "HR", label: "HR" },
    { value: "Finance", label: "Finance" },
    { value: "Sales", label: "Sales" },
    { value: "Support", label: "Support" },
    { value: "Bookkeeper", label: "Bookkeeper" },
    { value: "Accountant", label: "Accountant" },
  ];

  const salaryTypeOptions = [
    { value: "fixed", label: "fixed" },
    { value: "percentage", label: "percentage" },
  ];

  const statusOptions = [
    { value: "Active", label: "Active" },
    { value: "Inactive", label: "Inactive" },
    { value: "On Leave", label: "On Leave" },
  ];

  const maritalStatusOptions = [
    { value: "Single", label: "Single" },
    { value: "Married", label: "Married" },
    { value: "Divorced", label: "Divorced" },
    { value: "Widowed", label: "Widowed" },
  ];

  const bloodTypeOptions = [
    { value: "A+", label: "A+" },
    { value: "A-", label: "A-" },
    { value: "B+", label: "B+" },
    { value: "B-", label: "B-" },
    { value: "AB+", label: "AB+" },
    { value: "AB-", label: "AB-" },
    { value: "O+", label: "O+" },
    { value: "O-", label: "O-" },
  ];

  const genderOptions = [
    { value: "Male", label: "Male" },
    { value: "Female", label: "Female" },
  ];

  const [currentStep, setCurrentStep] = useState(0);

  const stepFields: string[][] = [
    // Step 0 - Account
    ["employeeId", "password", "role", "status", "employeeType"],
    // Step 1 - Personal
    [
      "firstName",
      "lastName",
      "dob",
      "placeOfBirth",
      "gender",
      "maritalStatus",
      "bloodType",
      "nationality",
      "personalPhotoUrl",
    ],
    // Step 2 - Contact
    [
      "email",
      "personalEmail",
      "phone",
      "alternatePhone",
      "address",
      "emergencyContact",
      "emergencyContactPhone",
      "emergencyContactRelation",
    ],
    // Step 3 - Job
    [
      "jobTitle",
      "department",
      "departmentId",
      "dateOfJoining",
      "managerId",
      "specializationsId",
      "salaryType",
      "baseSalary",
      "bankName",
      "bankAccountNumber",
    ],
    // Step 4 - Compensation & Documents
    [
      "highestQualification",
      "university",
      "graduationYear",
      "gpa",
      "certifications",
      "resumeUrl",
      "idProofUrl",
    ],
    // Step 5 - Experience & Review
    ["previousCompanyName", "previousJobTitle", "yearsOfExperience"],
  ];

  const totalSteps = stepFields.length;

  const handleNext = async () => {
    try {
      const fields = stepFields[currentStep] || [];
      const valid = await trigger(fields as (keyof UserFormValues)[]);
      if (valid) {
        setCurrentStep((s) => Math.min(s + 1, totalSteps - 1));
        return;
      }

      // If not valid, log errors and focus the first invalid field in this step.
      // eslint-disable-next-line no-console
      console.warn("Step validation failed", { step: currentStep, errors });

      for (const f of fields) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (errors && (errors as any)[f]) {
          try {
            // Try to focus the field using RHF's setFocus
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            setFocus(f as any);
          } catch (e) {
            // Fallback: try to scroll to DOM element
            const el = document.getElementById(f);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            if (el && typeof (el as any).scrollIntoView === "function") {
              el.scrollIntoView({ behavior: "smooth", block: "center" });
            }
          }
          break;
        }
      }
    } catch (err) {
      // Prevent unexpected errors from bubbling to a debugger; log and stay on the same step.
      // eslint-disable-next-line no-console
      console.error("Error validating step fields:", err);
    }
  };

  const handleBack = () => {
    try {
      setCurrentStep((s) => Math.max(s - 1, 0));
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Error navigating back:", err);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-sm">
      <h1 className="text-2xl font-semibold mb-4">اضافة موظف جديد</h1>

      {success && (
        <div className="mb-4 p-3 rounded text-sm bg-success/10 text-success">
          {success}
        </div>
      )}

      <form
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
        onSubmit={handleSubmit(onSubmit)}
        onKeyDown={(e) => {
          // Prevent Enter from submitting the whole form while navigating steps.
          if (e.key === "Enter" && currentStep < totalSteps - 1) {
            e.preventDefault();
            try {
              // attempt to advance to next step on Enter
              void handleNext();
            } catch (err) {
              // eslint-disable-next-line no-console
              console.error("Error handling Enter key navigation:", err);
            }
          }
        }}
        noValidate
      >
        {currentStep === 0 && (
          <>
            <TextField
              id="employeeId"
              label="رقم الموظف"
              register={register("employeeId")}
              error={errors.employeeId}
            />

            <PasswordField
              id="password"
              label="كلمة المرور"
              register={register("password")}
              error={errors.password}
            />

            <SelectField
              id="role"
              label="الدور"
              options={roleOptions}
              register={register("role")}
              error={errors.role}
            />

            <SelectField
              id="status"
              label="الحالة"
              options={statusOptions}
              register={register("status")}
              error={errors.status}
            />

            <SelectField
              id="employeeType"
              label="نوع الموظف"
              options={employeeTypeOptions}
              register={register("employeeType")}
              error={errors.employeeType}
            />
          </>
        )}

        {currentStep === 1 && (
          <>
            <TextField
              id="firstName"
              label="الاسم الاول"
              register={register("firstName")}
              error={errors.firstName}
            />

            <TextField
              id="lastName"
              label="اسم العائلة"
              register={register("lastName")}
              error={errors.lastName}
            />

            <DateField
              id="dateOfBirth"
              label="تاريخ الميلاد"
              register={register("dob")}
              error={errors.dob}
            />

            <TextField
              id="placeOfBirth"
              label="مكان الميلاد (اختياري)"
              register={register("placeOfBirth")}
              error={errors.placeOfBirth}
            />

            <SelectField
              id="gender"
              label="الجنس"
              options={genderOptions}
              register={register("gender")}
              error={errors.gender}
            />

            <SelectField
              id="maritalStatus"
              label="الحالة الاجتماعية"
              options={maritalStatusOptions}
              register={register("maritalStatus")}
              error={errors.maritalStatus}
            />

            <SelectField
              id="bloodType"
              label="فصيلة الدم (اختياري)"
              options={bloodTypeOptions}
              register={register("bloodType")}
              error={errors.bloodType}
            />

            <TextField
              id="nationality"
              label="الجنسية (اختياري)"
              register={register("nationality")}
              error={errors.nationality}
            />

            <TextField
              id="personalPhotoUrl"
              label="رابط الصورة الشخصية (اختياري)"
              type="text"
              register={register("personalPhotoUrl")}
              error={errors.personalPhotoUrl}
            />
          </>
        )}

        {currentStep === 2 && (
          <>
            <TextField
              id="email"
              label="البريد الالكتروني"
              type="email"
              register={register("email")}
              error={errors.email}
            />

            <TextField
              id="personalEmail"
              label="البريد الإلكتروني الشخصي (اختياري)"
              type="email"
              register={register("personalEmail")}
              error={errors.personalEmail}
            />

            <TextField
              id="phone"
              label="الهاتف (اختياري)"
              register={register("phone")}
              error={errors.phone}
            />

            <TextField
              id="alternatePhone"
              label="هاتف بديل (اختياري)"
              register={register("alternatePhone")}
              error={errors.alternatePhone}
            />

            <TextField
              id="address"
              label="العنوان (اختياري)"
              register={register("address")}
              error={errors.address}
            />

            <TextField
              id="emergencyContact"
              label="اسم جهة الطوارئ (اختياري)"
              register={register("emergencyContact")}
              error={errors.emergencyContact}
            />

            <TextField
              id="emergencyContactPhone"
              label="هاتف جهة الطوارئ (اختياري)"
              register={register("emergencyContactPhone")}
              error={errors.emergencyContactPhone}
            />

            <TextField
              id="emergencyContactRelation"
              label="صلة جهة الطوارئ (اختياري)"
              register={register("emergencyContactRelation")}
              error={errors.emergencyContactRelation}
            />
          </>
        )}

        {currentStep === 3 && (
          <>
            <TextField
              id="jobTitle"
              label="المسمى الوظيفي"
              register={register("jobTitle")}
              error={errors.jobTitle}
            />

            <TextField
              id="department"
              label="القسم"
              register={register("department")}
              error={errors.department}
            />

            <TextField
              id="departmentId"
              label="معرف القسم (اختياري)"
              register={register("departmentId")}
              error={errors.departmentId}
            />

            <DateField
              id="dateOfJoining"
              label="تاريخ الانضمام (اختياري)"
              register={register("dateOfJoining")}
              error={errors.dateOfJoining}
            />

            <TextField
              id="managerId"
              label="معرف المدير (اختياري)"
              register={register("managerId")}
              error={errors.managerId}
            />

            <TextField
              id="specializationsId"
              label="معرف التخصصات (اختياري)"
              register={register("specializationsId")}
              error={errors.specializationsId}
            />

            <SelectField
              id="salaryType"
              label="نوع الراتب"
              options={salaryTypeOptions}
              register={register("salaryType")}
              error={errors.salaryType}
            />

            <NumberField
              id="baseSalary"
              label="الراتب الاساسي (اختياري)"
              step={100}
              register={register("baseSalary", { valueAsNumber: true })}
              error={errors.baseSalary}
            />

            <TextField
              id="bankName"
              label="اسم البنك (اختياري)"
              register={register("bankName")}
              error={errors.bankName}
            />

            <TextField
              id="bankAccountNumber"
              label="رقم الحساب البنكي (اختياري)"
              register={register("bankAccountNumber")}
              error={errors.bankAccountNumber}
            />
          </>
        )}

        {currentStep === 4 && (
          <>
            <TextField
              id="highestQualification"
              label="أعلى مؤهل (اختياري)"
              register={register("highestQualification")}
              error={errors.highestQualification}
            />

            <TextField
              id="university"
              label="الجامعة (اختياري)"
              register={register("university")}
              error={errors.university}
            />

            <NumberField
              id="graduationYear"
              label="سنة التخرج (اختياري)"
              step={1}
              register={register("graduationYear", { valueAsNumber: true })}
              error={errors.graduationYear}
            />

            <NumberField
              id="gpa"
              label="المعدل (اختياري)"
              step={0.01}
              register={register("gpa", { valueAsNumber: true })}
              error={errors.gpa}
            />

            <TextField
              id="resumeUrl"
              label="رابط السيرة الذاتية (اختياري)"
              type="text"
              register={register("resumeUrl")}
              error={errors.resumeUrl}
            />

            <TextField
              id="idProofUrl"
              label="رابط إثبات الهوية (اختياري)"
              type="text"
              register={register("idProofUrl")}
              error={errors.idProofUrl}
            />
          </>
        )}

        {currentStep === 5 && (
          <>
            <TextField
              id="previousCompanyName"
              label="اسم الشركة السابقة (اختياري)"
              register={register("previousCompanyName")}
              error={errors.previousCompanyName}
            />

            <TextField
              id="previousJobTitle"
              label="المسمى الوظيفي السابق (اختياري)"
              register={register("previousJobTitle")}
              error={errors.previousJobTitle}
            />

            <NumberField
              id="yearsOfExperience"
              label="سنوات الخبرة (اختياري)"
              step={1}
              register={register("yearsOfExperience", { valueAsNumber: true })}
              error={errors.yearsOfExperience}
            />
          </>
        )}

        <div className="md:col-span-2 flex justify-between gap-2 mt-3">
          <div>
            {currentStep > 0 && (
              <Button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  handleBack();
                }}
              >
                العودة
              </Button>
            )}
          </div>

          <div className="flex gap-2">
            {currentStep < totalSteps - 1 && (
              <Button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  handleNext();
                }}
              >
                التالي
              </Button>
            )}

            {currentStep === totalSteps - 1 && (
              <Button loading={loading} type="submit">
                اضافة موظف
              </Button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
};

export default NewEmployeeForm;
