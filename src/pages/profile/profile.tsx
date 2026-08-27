import { Link } from "react-router-dom";
import { KeyRound, User } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { useMyProfile, MyProfileUpdate } from "../../hooks/profile/useMyProfile";
import {
  useMyEmployeeInfo,
  MyEmployeeInfoUpdate,
} from "../../hooks/profile/useMyEmployeeInfo";
import LoadingPage from "../../components/ui/LoadingPage";
import ErrorPage from "../../components/ui/errorPage";
import EditableInfoCard from "../../components/profile/EditableInfoCard";

const STATUS_LABELS: Record<string, string> = {
  active: "نشط",
  inactive: "غير نشط",
  "on leave": "في إجازة",
  "on holiday": "في عطلة",
};

const ProfilePage = () => {
  const { user, refreshUser } = useAuth();
  const {
    profile,
    loading: profileLoading,
    error: profileError,
    updateProfile,
  } = useMyProfile(user?.id);
  const {
    info: employeeInfo,
    loading: employeeInfoLoading,
    updateInfo: updateEmployeeInfo,
  } = useMyEmployeeInfo(user?.id);

  if (profileLoading || employeeInfoLoading) return <LoadingPage />;
  if (profileError) return <ErrorPage error={profileError.message} />;
  if (!profile) return null;

  const initials = `${profile.first_name?.[0] ?? ""}${profile.last_name?.[0] ?? ""}`.toUpperCase();

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-4">
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-primary-superLight text-primary flex items-center justify-center font-semibold text-lg flex-shrink-0">
          {initials || <User className="w-6 h-6" />}
        </div>
        <div>
          <h1 className="text-xl font-semibold text-gray-900">
            {profile.first_name} {profile.last_name}
          </h1>
          <p className="text-sm text-gray-500">
            {user?.role} · {STATUS_LABELS[profile.status] ?? profile.status}
          </p>
          <p className="text-sm text-gray-500">{profile.email}</p>
        </div>
      </div>

      <EditableInfoCard
        title="المعلومات الشخصية"
        fields={[
          { key: "first_name", label: "الاسم الأول" },
          { key: "last_name", label: "الاسم الأخير" },
          { key: "phone", label: "رقم الهاتف", type: "tel" },
          { key: "dob", label: "تاريخ الميلاد", type: "date" },
        ]}
        values={{
          first_name: profile.first_name,
          last_name: profile.last_name,
          phone: profile.phone,
          dob: profile.dob,
        }}
        onSave={async (updates) => {
          const result = await updateProfile(updates as MyProfileUpdate);
          if (!result.error) await refreshUser();
          return result;
        }}
      />

      <EditableInfoCard
        title="معلومات الموظف"
        emptyMessage="لا تتوفر بيانات موظف"
        fields={[
          { key: "address", label: "العنوان" },
          {
            key: "gender",
            label: "الجنس",
            type: "select",
            options: [
              { value: "Male", label: "ذكر" },
              { value: "Female", label: "انثي" },
            ],
          },
          { key: "nationality", label: "الجنسية" },
          {
            key: "blood_type",
            label: "فصيلة الدم",
            type: "select",
            options: [
              { value: "A+", label: "A+" },
              { value: "A-", label: "A-" },
              { value: "B+", label: "B+" },
              { value: "B-", label: "B-" },
              { value: "AB+", label: "AB+" },
              { value: "AB-", label: "AB-" },
              { value: "O+", label: "O+" },
              { value: "O-", label: "O-" },
            ],
          },
          { key: "alternate_phone", label: "هاتف بديل", type: "tel" },
        ]}
        values={
          employeeInfo && {
            address: employeeInfo.address,
            gender: employeeInfo.gender,
            nationality: employeeInfo.nationality,
            blood_type: employeeInfo.blood_type,
            alternate_phone: employeeInfo.alternate_phone,
          }
        }
        onSave={(updates) =>
          updateEmployeeInfo(updates as MyEmployeeInfoUpdate)
        }
      />

      <EditableInfoCard
        title="المعلومات البنكية"
        emptyMessage="لا تتوفر بيانات موظف"
        fields={[
          { key: "bank_name", label: "اسم البنك" },
          { key: "bank_account_number", label: "رقم الحساب البنكي" },
        ]}
        values={
          employeeInfo && {
            bank_name: employeeInfo.bank_name,
            bank_account_number: employeeInfo.bank_account_number,
          }
        }
        onSave={(updates) =>
          updateEmployeeInfo(updates as MyEmployeeInfoUpdate)
        }
      />

      <div className="bg-white border border-gray-200 rounded-xl p-6 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-gray-700">
            كلمة المرور
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            يمكنك تغيير كلمة مرور حسابك في أي وقت
          </p>
        </div>
        <Link
          to="/change-password"
          className="flex items-center gap-1.5 text-sm px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <KeyRound className="w-4 h-4" />
          تغيير كلمة المرور
        </Link>
      </div>
    </div>
  );
};

export default ProfilePage;
