import { supabaseAdmin } from "../../lib/adminSupabase";
import { ContractorFormValues } from "../../types/schema/contractors.schema";

export async function AddContractors(form: ContractorFormValues) {
  const { data: userData, error: userError } =
    await supabaseAdmin.auth.admin.createUser({
      email: form.email,
      password: form.password,
      email_confirm: true,
      user_metadata: {
        firstName: form.firstName,
        lastName: form.lastName,
        phone: form.phone,
        nationality: form.nationality,
        roleId: "20606a44-1f4b-4e0a-af58-abc553b70bc0",
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

  const { error } = await supabaseAdmin.from("contractors").insert({
    id: userId,
    first_name: form.firstName,
    last_name: form.lastName,
    email: form.email,
    phone_number: form.phone,
  });

  if (error) {
    console.error("Error inserting contractor data:", error);
    return {
      success: false,
      error: error,
      message: "فشل في إنشاء المقاول",
    };
  }

  //user role
  const { error: userRoleError } = await supabaseAdmin
    .from("user_roles")
    .insert({
      role_id: "20606a44-1f4b-4e0a-af58-abc553b70bc0",
      user_id: userId,
    });

  if (userRoleError) {
    console.error("Error inserting user role data:", userRoleError);
    return {
      success: false,
      error: userRoleError,
      message: "فشل في تعيين دور المستخدم",
    };
  }

  // user specializations
  const { error: userSpecError } = await supabaseAdmin
    .from("user_specializations")
    .insert({
      specialization_id: form.specializationId,
      user_id: userId,
    });

  if (userSpecError) {
    console.error("Error inserting user specialization data:", userSpecError);
    return {
      success: false,
      error: userSpecError,
      message: "فشل في تعيين تخصص المستخدم",
    };
  }

  return { success: true, message: "تم إنشاء المقاول بنجاح" };
}
