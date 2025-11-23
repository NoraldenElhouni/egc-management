import { supabaseAdmin } from "../../lib/adminSupabase";
import { Employees } from "../../types/global.type";
import { UserFormValues } from "../../types/schema/users.schema";

export const createEmployee = async (data: UserFormValues) => {
  const normalizeEmptyToNull = (v?: string | null) => {
    if (v === undefined || v === null) return null;
    const t = String(v).trim();
    return t === "" ? null : t;
  };

  const { data: userData, error: userError } =
    await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: {
        employeeId: data.employeeId,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        nationality: data.nationality,
        dob: data.dob,
        employeeType: data.employeeType,
        roleId: data.roleId ?? "803c44ac-0af1-4586-81a2-67e1bc7eb7ef",
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

  const userId = userData.user?.id ?? null;
  if (!userId) {
    console.error("No user id returned from auth.createUser", userData);
    return {
      success: false,
      error: new Error("No user id created"),
      message: "فشل في إنشاء المستخدم - معرف المستخدم غير متاح",
    };
  }

  const { data: roleData, error: userRoleError } = await supabaseAdmin
    .from("roles")
    .select("*")
    .eq("id", data.roleId ?? "212424d8-219a-4899-a24b-5d5bf05546e8")
    .single();

  if (userRoleError) {
    console.error("Error fetching role data:", userRoleError);
    return {
      success: false,
      error: userRoleError,
      message: "فشل في جلب بيانات الدور",
    };
  }

  const normalizeUuidOrDefault = (
    v: string | undefined | null,
    def: string
  ) => {
    if (v === undefined || v === null) return def;
    const t = String(v).trim();
    return t === "" ? def : t;
  };

  const employeePayload: Employees = {
    id: userId,
    employee_id: `${roleData.code}${roleData.number + 1}`,
    first_name: data.firstName ?? "",
    last_name: data.lastName ?? null,
    email: data.email ?? "",
    phone_number: data.phone ?? "",
    base_salary: data.baseSalary ?? 0,
    specializations_id: data.specializationsId ?? null,
    dob: normalizeEmptyToNull(data.dob),
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
    date_of_joining: normalizeEmptyToNull(data.dateOfJoining),
    manager_id: normalizeEmptyToNull(data.managerId),
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
  const roleToAssign = normalizeUuidOrDefault(
    data.roleId,
    "212424d8-219a-4899-a24b-5d5bf05546e8"
  );

  const { error: roleError } = await supabaseAdmin.from("user_roles").insert({
    role_id: roleToAssign,
    user_id: userId,
  });

  if (roleError) {
    console.error(roleError);
    return {
      success: false,
      error: roleError,
      message: "فشل في إنشاء منصب المستخدم",
    };
  }

  //update role number
  const { error: updateRoleError } = await supabaseAdmin
    .from("roles")
    .update({ number: roleData.number + 1 })
    .eq("id", roleToAssign);

  if (updateRoleError) {
    console.error("Error updating role number:", updateRoleError);
    return {
      success: false,
      error: updateRoleError,
      message: "فشل في تحديث رقم الدور",
    };
  }

  return { success: true, data: userData, message: "تم إنشاء المستخدم بنجاح" };
};
