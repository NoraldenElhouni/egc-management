import { useState } from "react";
import { updateJobRequestStatus } from "../../../services/hr/jobRequestsService";
import { JOB_REQUEST_STATUS_OPTIONS, JobRequestStatus } from "../../../types/hr.type";

interface JobRequestStatusControlProps {
  jobRequestId: string;
  status: string;
  onUpdated: () => void | Promise<void>;
  disabled?: boolean;
}

const JobRequestStatusControl: React.FC<JobRequestStatusControlProps> = ({
  jobRequestId,
  status,
  onUpdated,
  disabled,
}) => {
  const [saving, setSaving] = useState(false);

  const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const next = e.target.value as JobRequestStatus;
    if (next === status) return;
    setSaving(true);
    try {
      const { error } = await updateJobRequestStatus(jobRequestId, next);
      if (error) {
        alert("فشل في تحديث حالة الطلب");
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
        {JOB_REQUEST_STATUS_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default JobRequestStatusControl;
