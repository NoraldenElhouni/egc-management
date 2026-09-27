import { useState } from "react";
import { ImageUploadField } from "../../ui/inputs/ImageUploadField";
import { updateApplicantCv } from "../../../services/hr/applicantsService";
import type { Applicant } from "../../../types/hr.type";
import {
  applicantGenderLabel,
  currentEmploymentStatusLabel,
  experienceLevelLabel,
} from "../../../types/hr.type";

interface ApplicantPersonalInfoCardProps {
  applicant: Applicant;
  onUpdated?: () => void | Promise<void>;
}

const Field = ({ label, value }: { label: string; value: string | null | undefined }) => (
  <div>
    <div className="text-xs text-gray-400">{label}</div>
    <div className="text-sm text-gray-800 mt-0.5">{value || "غير محدد"}</div>
  </div>
);

const ApplicantPersonalInfoCard: React.FC<ApplicantPersonalInfoCardProps> = ({
  applicant,
  onUpdated,
}) => {
  const [uploadingCv, setUploadingCv] = useState(false);

  const handleCvUpload = async (url: string) => {
    if (!url) return;
    setUploadingCv(true);
    try {
      const { error } = await updateApplicantCv(applicant.id, url);
      if (error) {
        alert("فشل في رفع السيرة الذاتية");
        return;
      }
      await onUpdated?.();
    } finally {
      setUploadingCv(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 border">
      <div className="flex items-start justify-between mb-4 gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">
            {applicant.full_name}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {applicant.applied_position ?? "بدون وظيفة محددة"}
          </p>
        </div>

        <div className="flex-shrink-0 text-left">
          {applicant.cv_file_url ? (
            <a
              href={applicant.cv_file_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline"
            >
              عرض السيرة الذاتية
            </a>
          ) : (
            <div className="w-56">
              <ImageUploadField
                id="applicant-cv"
                label="رفع السيرة الذاتية (اختياري)"
                onChange={handleCvUpload}
                bucket="employees"
                folder="applicants"
                maxSizeMB={10}
                accept=".pdf,.doc,.docx"
                preview={false}
                disabled={uploadingCv}
              />
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Field label="الجنس" value={applicantGenderLabel(applicant.gender)} />
        <Field label="تاريخ الميلاد" value={applicant.birth_date} />
        <Field label="رقم الهاتف (واتساب)" value={applicant.phone_whatsapp} />
        <Field label="التخصص العلمي" value={applicant.specialization} />
        <Field label="الجامعة / المعهد" value={applicant.university} />
        <Field label="المعدل / التقدير" value={applicant.gpa_grade} />
        <Field
          label="سنة التخرج"
          value={applicant.graduation_year?.toString()}
        />
        <Field
          label="سنوات الخبرة"
          value={experienceLevelLabel(applicant.experience_level)}
        />
        <Field
          label="حالة العمل الحالية"
          value={currentEmploymentStatusLabel(applicant.current_employment_status)}
        />
        <Field label="كيف تقدم؟" value={applicant.application_source} />
      </div>

      {applicant.general_notes && (
        <div className="mt-4 pt-4 border-t">
          <div className="text-xs text-gray-400 mb-1">ملاحظات عامة</div>
          <p className="text-sm text-gray-700 whitespace-pre-wrap">
            {applicant.general_notes}
          </p>
        </div>
      )}
    </div>
  );
};

export default ApplicantPersonalInfoCard;
