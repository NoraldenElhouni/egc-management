import type { JobRequest } from "../../../types/hr.type";

interface JobRequestInfoCardProps {
  jobRequest: JobRequest;
}

const Field = ({ label, value }: { label: string; value: string | number | null | undefined }) => (
  <div>
    <div className="text-xs text-gray-400">{label}</div>
    <div className="text-sm text-gray-800 mt-0.5">{value || "غير محدد"}</div>
  </div>
);

const JobRequestInfoCard: React.FC<JobRequestInfoCardProps> = ({
  jobRequest,
}) => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6 border">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">
        {jobRequest.position_title}
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Field label="القسم" value={jobRequest.department} />
        <Field label="عدد الشواغر" value={jobRequest.positions_count} />
        <Field
          label="تاريخ الطلب"
          value={new Date(jobRequest.created_at).toLocaleDateString("ar-LY")}
        />
      </div>

      {jobRequest.justification && (
        <div className="mt-4 pt-4 border-t">
          <div className="text-xs text-gray-400 mb-1">سبب الطلب / وصف الحاجة</div>
          <p className="text-sm text-gray-700 whitespace-pre-wrap">
            {jobRequest.justification}
          </p>
        </div>
      )}
    </div>
  );
};

export default JobRequestInfoCard;
