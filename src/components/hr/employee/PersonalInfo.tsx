import { supabase } from "../../../lib/supabaseClient";
import { FullEmployee } from "../../../types/extended.type";
import AddressCard, { AddressValues } from "./cards/AddressCard";
import BasicInfoCard, { BasicInfoValues } from "./cards/BasicInfoCard";
import EducationCard, { EducationValues } from "./cards/EducationCard";
import EmergencyContactCard, {
  EmergencyContactValues,
} from "./cards/EmergencyContactCard";

interface PersonalInfoProps {
  employee: FullEmployee;
  onUpdated: () => void | Promise<void>;
}

const PersonalInfo = ({ employee, onUpdated }: PersonalInfoProps) => {
  const handleSaveBasic = async (data: BasicInfoValues) => {
    const { error } = await supabase
      .from("employees")
      .update(data)
      .eq("id", employee.id);

    if (error) {
      console.error(error);
      throw error;
    }

    // update images in docus
    const { error: updateDocumentsError } = await supabase
      .from("employee_documents")
      .update({
        url: data.personal_photo_url || "",
      })
      .eq("employee_id", employee.id)
      .eq("type", "personal_photo");

    if (updateDocumentsError) {
      console.error(updateDocumentsError);
      throw updateDocumentsError;
    }

    new Notification("تم التحديث", {
      body: "تم حفظ المعلومات الأساسية بنجاح.",
    });
    await onUpdated();
  };

  const handleSaveAddress = async (data: AddressValues) => {
    const { error } = await supabase
      .from("employees")
      .update(data)
      .eq("id", employee.id);

    if (error) {
      console.error(error);
      throw error;
    }

    await onUpdated();
  };
  const handleSaveEducation = async (data: EducationValues) => {
    // 1) نظّف البيانات
    const rows = (data.employee_certifications ?? [])
      .map((c) => ({
        id: c.id, // ✅ مهم للتحديث
        employee_id: employee.id,
        certification: (c.certification || "").trim(),
      }))
      .filter((c) => c.certification.length > 0);

    // 2) upsert (تحديث + إضافة)
    const { error: upsertError } = await supabase
      .from("employee_certifications")
      .upsert(rows, { onConflict: "id" }); // ✅ يعتمد على PK id

    if (upsertError) {
      console.error(upsertError);
      throw upsertError;
    }

    // 3) حذف الشهادات التي انمسحت من الواجهة
    const keepIds = rows.map((r) => r.id).filter(Boolean) as string[];

    // كل شهادات الموظف الحالية من employee.employee_certifications
    const existingIds =
      ((employee.employee_certifications as { id?: string }[] | null)
        ?.map((c) => c.id)
        .filter(Boolean) as string[]) || [];

    const toDelete = existingIds.filter((id) => !keepIds.includes(id));

    if (toDelete.length) {
      const { error: deleteError } = await supabase
        .from("employee_certifications")
        .delete()
        .in("id", toDelete)
        .eq("employee_id", employee.id);

      if (deleteError) {
        console.error(deleteError);
        throw deleteError;
      }
    }

    await onUpdated();
  };

  const handleSaveEmergency = async (data: EmergencyContactValues) => {
    const { error } = await supabase
      .from("employees")
      .update(data)
      .eq("id", employee.id);

    if (error) throw error;

    await onUpdated();
  };

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="p-6">
        <h3 className="text-lg font-medium text-gray-800 mb-4">
          المعلومات الشخصية
        </h3>

        <BasicInfoCard employee={employee} onSave={handleSaveBasic} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <AddressCard employee={employee} onSave={handleSaveAddress} />
            <EducationCard employee={employee} onSave={handleSaveEducation} />
          </div>

          <div className="space-y-6">
            <EmergencyContactCard
              employee={employee}
              onSave={handleSaveEmergency}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PersonalInfo;
