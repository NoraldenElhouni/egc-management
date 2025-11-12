import { supabaseAdmin } from "../../lib/adminSupabase";
import { UserFormValues } from "../../types/schema/users.shema";

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
    console.log("Error creating auth user:", userError);
    return {
      success: false,
      error: userError,
      message: "فشل في إنشاء المستخدم",
    };
  }

  return { success: true, data: userData, message: "تم إنشاء المستخدم بنجاح" };
};
