import { useState } from "react";
import { updateApplicantStatus } from "../../../services/hr/applicantsService";
import { APPLICATION_STATUS_OPTIONS, ApplicationStatus } from "../../../types/hr.type";

interface ApplicantStatusControlProps {
  applicantId: string;
  /** `hr.applicants.application_status` — a check-constrained string, not a narrow literal type. */
  status: string;
  onUpdated: () => void | Promise<void>;
  disabled?: boolean;
}

const ApplicantStatusControl: React.FC<ApplicantStatusControlProps> = ({
  applicantId,
  status,
  onUpdated,
  disabled,
}) => {
  const [saving, setSaving] = useState(false);

  const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const next = e.target.value as ApplicationStatus;
    if (next === status) return;
    setSaving(true);
    try {
      const { error } = await updateApplicantStatus(applicantId, next);
      if (error) {
        alert("فشل في تحديث حالة المتقدم");
        return;
      }
      await onUpdated();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-500">الحالة:</span>
      <select
        value={status}
        onChange={handleChange}
        disabled={saving || disabled}
        className="border rounded px-2 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary"
      >
        {APPLICATION_STATUS_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default ApplicantStatusControl;
