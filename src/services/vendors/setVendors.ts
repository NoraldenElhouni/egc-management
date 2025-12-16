import { supabaseAdmin } from "../../lib/adminSupabase";
import { Vendor } from "../../types/global.type";
import { VendorFormValues } from "../../types/schema/vendor.schema";

export async function addVendor(form: VendorFormValues) {
  const { data: userData, error: userError } =
    await supabaseAdmin.auth.admin.createUser({
      email: form.email,
      password: form.password,
      email_confirm: true,
      user_metadata: {
        firstName: form.vendor_name,
        lastName: form.contact_name,
        phone: form.phone_number,
        roleId: "7cfabb14-ee17-48bc-b03f-4199ef32d1e0",
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

    const { error } = await supabaseAdmin.from("vendors").insert({
    id: userId,
    vendor_name: form.vendor_name,
    contact_name: form.contact_name,
    email: form.email,
    phone_number: form.phone_number,
    alt_phone_number: form.alt_phone_number ?? "",
    country: form.country,
    city: form.city,
    address: form.address,
    latitude: form.latitude ?? null,
    longitude: form.longitude ?? null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  } as Vendor);

  if (error) {
    console.error("Error inserting vendor:", error);
    return {
      success: false,
      error,
      message: "فشل في إنشاء البائع",
    };
  }

  return {
    success: true,
    message: "تم إنشاء البائع بنجاح",
  };
}