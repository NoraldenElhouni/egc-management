import { fullEmployee } from "../../../types/extended.type";
import AddressCard from "./cards/AddressCard";
import BasicInfoCard from "./cards/BasicInfoCard";
import EducationCard from "./cards/EducationCard";
import EmergencyContactCard from "./cards/EmergencyContactCard";

interface PersonalInfoProps {
  employee: fullEmployee;
}

const PersonalInfo = ({ employee }: PersonalInfoProps) => {
  const handleSaveBasic = (data: fullEmployee) => {
    console.log("Save basic:", data);
    // TODO: call API / persist changes
  };

  const handleSaveAddress = (data: fullEmployee) => {
    console.log("Save address:", data);
  };

  const handleSaveEducation = (data: fullEmployee) => {
    console.log("Save education:", data);
  };

  const handleSaveEmergency = (data: fullEmployee) => {
    console.log("Save emergency:", data);
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
