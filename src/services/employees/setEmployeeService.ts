import { supabaseAdmin } from "../../lib/adminSupabase";
import { Employees } from "../../types/global.type";
import { UserFormValues } from "../../types/schema/users.schema";

export const createEmployee = async (data: UserFormValues) => {
  const { data: userData, error: userError } =
    await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: {
        role: data.role,
        employeeId: data.employeeId,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        jobTitle: data.jobTitle,
        department: data.department,
        nationality: data.nationality,
        dob: data.dob,
        employeeType: data.employeeType,
        roleId: "803c44ac-0af1-4586-81a2-67e1bc7eb7ef",
      },
    });

  if (userError) {
    console.error("Error creating auth user:", userError);
    return {
      success: false,
      error: userError,
      message: "فشل في إنشاء المستخدم",
    };
  }

  const employeePayload: Employees = {
    id: userData.user?.id ?? "",
    employee_id: data.employeeId ?? null,
    first_name: data.firstName ?? "",
    last_name: data.lastName ?? null,
    email: data.email ?? "",
    phone_number: data.phone ?? "",
    base_salary: data.baseSalary ?? 0,
    specializations_id:
      data.specializationsId ?? "9c0e032a-2497-4f24-9b27-368df40a32c7",
    department_id: data.departmentId ?? "608442b1-7fdf-4b4b-b0d6-a0569e172aa4",
    dob: data.dob ?? null,
    place_of_birth: data.placeOfBirth ?? null,
    marital_status: data.maritalStatus ?? null,
    blood_type: data.bloodType ?? null,
    nationality: data.nationality ?? null,
    gender: data.gender ?? null,
    personal_email: data.personalEmail ?? null,
    alternate_phone: data.alternatePhone ?? null,
    address: data.address ?? null,
    emergency_contact: data.emergencyContact ?? null,
    emergency_contact_phone: data.emergencyContactPhone ?? null,
    emergency_contact_relation: data.emergencyContactRelation ?? null,
    employee_type: data.employeeType ?? null,
    job_title: data.jobTitle ?? null,
    date_of_joining: data.dateOfJoining ?? null,
    manager_id: data.managerId ?? null,
    status: data.status ?? null,
    salary_type: data.salaryType ?? null,
    bank_name: data.bankName ?? null,
    bank_account_number: data.bankAccountNumber ?? null,
    highest_qualification: data.highestQualification ?? null,
    university: data.university ?? null,
    graduation_year: data.graduationYear ?? null,
    gpa: data.gpa ?? null,
    resume_url: data.resumeUrl ?? null,
    id_proof_url: data.idProofUrl ?? null,
    personal_photo_url: data.personalPhotoUrl ?? null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const { error: profileError } = await supabaseAdmin
    .from("employees")
    .insert(employeePayload);

  if (profileError) {
    console.error("Error creating employee profile:", profileError);
    return {
      success: false,
      error: profileError,
      message: "فشل في إنشاء ملف الموظف",
    };
  }

  // role
  const { error: roleError } = await supabaseAdmin.from("user_roles").insert({
    role_id: "212424d8-219a-4899-a24b-5d5bf05546e8",
    user_id: userData.user?.id ?? "",
  });

  if (roleError) {
    console.error(roleError);
    return {
      success: false,
      error: roleError,
      message: "فشل في إنشاء منصب المستخدم",
    };
  }

  return { success: true, data: userData, message: "تم إنشاء المستخدم بنجاح" };
};
