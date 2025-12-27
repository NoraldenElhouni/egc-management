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

    if (error) throw error;

    new Notification("Employee Updated", {
      body: "Basic information saved successfully",
    });
    await onUpdated();
  };

  const handleSaveAddress = async (data: AddressValues) => {
    const { error } = await supabase
      .from("employees")
      .update(data)
      .eq("id", employee.id);

    if (error) throw error;

    await onUpdated();
  };
  const handleSaveEducation = async (data: EducationValues) => {
    // IMPORTANT: This is usually NOT a single update call,
    // because certifications are in a separate table.
    // You'll likely do: delete+insert OR upsert.

    // Example upsert (depends on your table structure):
    // await supabase.from("employee_certifications").delete().eq("employee_id", employee.id);
    // await supabase.from("employee_certifications").insert(
    //   data.employee_certifications.map(c => ({ employee_id: employee.id, certification: c.certification }))
    // );

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
