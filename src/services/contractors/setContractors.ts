import { supabaseAdmin } from "../../lib/adminSupabase";
import { ContractorFormValues } from "../../types/schema/contractors.schema";

export async function AddContractors(form: ContractorFormValues) {
  const email = (form.email ?? "").trim();
  const password = form.password ?? "";
  const shouldCreateAuthUser = email.length > 0 && password.length > 0;

  const roleId = "20606a44-1f4b-4e0a-af58-abc553b70bc0";

  // 1) Create auth user only if email + password exist
  let authUserId: string | null = null;

  if (shouldCreateAuthUser) {
    const { data: userData, error: userError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          firstName: form.firstName,
          lastName: form.lastName,
          phone: (form.phone ?? "").trim() || null,
          nationality: (form.nationality ?? "").trim() || null,
          roleId,
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

    authUserId = userData.user?.id ?? null;
    if (!authUserId) {
      return {
        success: false,
        error: new Error("No user id returned"),
        message: "فشل في إنشاء المستخدم - معرف المستخدم غير متاح",
      };
    }
  }

  // 2) Insert contractor with its own id + optional user_id
  const contractorPayload = {
    first_name: form.firstName,
    last_name: (form.lastName ?? "").trim() || null,
    email: email || null,
    phone_number: (form.phone ?? "").trim(), // NOTE: table says NOT NULL (see note below)
    user_id: authUserId, // null if no auth user created
  };

  const { data: contractor, error: contractorErr } = await supabaseAdmin
    .from("contractors")
    .insert(contractorPayload)
    .select("id,user_id")
    .single();

  if (contractorErr) {
    console.error("Error inserting contractor:", contractorErr);
    return {
      success: false,
      error: contractorErr,
      message: "فشل في إنشاء المقاول",
    };
  }

  if (authUserId) {
    const { error: userRoleError } = await supabaseAdmin
      .from("user_roles")
      .insert({
        role_id: roleId,
        user_id: authUserId,
      });

    if (userRoleError) {
      console.error("Error inserting user role:", userRoleError);
      return {
        success: false,
        error: userRoleError,
        message: "فشل في تعيين دور المستخدم",
      };
    }

    const { error: userSpecError } = await supabaseAdmin
      .from("user_specializations")
      .insert({
        specialization_id: form.specializationId,
        user_id: authUserId,
      });

    if (userSpecError) {
      console.error("Error inserting user specialization:", userSpecError);
      return {
        success: false,
        error: userSpecError,
        message: "فشل في تعيين تخصص المستخدم",
      };
    }
  }

  return {
    success: true,
    message: authUserId
      ? "تم إنشاء المقاول (مع حساب دخول) بنجاح"
      : "تم إنشاء المقاول بنجاح (بدون حساب دخول)",
    contractorId: contractor.id,
    authUserId,
  };
}

export async function AssignUserToContractor({
  contractorId,
  email,
  password,
}: {
  contractorId: string;
  email: string;
  password: string;
}) {
  const roleId = "20606a44-1f4b-4e0a-af58-abc553b70bc0"; // Contractor role

  // 1) Fetch the contractor to get their name/phone for metadata
  const { data: contractor, error: fetchErr } = await supabaseAdmin
    .from("contractors")
    .select("id, first_name, last_name, phone_number")
    .eq("id", contractorId)
    .single();

  if (fetchErr || !contractor) {
    console.error(fetchErr);
    return {
      success: false,
      error: fetchErr,
      message: "فشل في جلب بيانات المقاول",
    };
  }

  // 2) Create the auth user
  const { data: userData, error: userError } =
    await supabaseAdmin.auth.admin.createUser({
      email: email.trim(),
      password,
      email_confirm: true,
      user_metadata: {
        firstName: contractor.first_name,
        lastName: contractor.last_name ?? "",
        phone: contractor.phone_number ?? null,
        roleId,
      },
    });

  if (userError || !userData.user) {
    console.error(userError);

    return {
      success: false,
      error: userError,
      message: "فشل في إنشاء حساب المستخدم",
    };
  }

  const authUserId = userData.user.id;

  // 3) Link the auth user to the contractor row
  const { error: updateErr } = await supabaseAdmin
    .from("contractors")
    .update({ user_id: authUserId, email: email })
    .eq("id", contractorId);

  if (updateErr) {
    console.error(updateErr);

    // Auth user was created but linking failed — you may want to delete the auth user here
    await supabaseAdmin.auth.admin.deleteUser(authUserId);
    return {
      success: false,
      error: updateErr,
      message: "فشل في ربط الحساب بالمقاول",
    };
  }

  // 4) Assign the contractor role
  const { error: roleErr } = await supabaseAdmin
    .from("user_roles")
    .insert({ role_id: roleId, user_id: authUserId });

  if (roleErr) {
    console.error(roleErr);
    return {
      success: false,
      error: roleErr,
      message: "فشل في تعيين دور المستخدم",
    };
  }

  return {
    success: true,
    message: "تم ربط الحساب بالمقاول بنجاح",
    authUserId,
    contractorId,
  };
}
