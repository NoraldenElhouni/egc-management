import type { ApplicantScore } from "../../../types/hr.type";

interface ApplicantScoreCardProps {
  score: ApplicantScore | null;
}

const Part = ({ label, value }: { label: string; value: number | null }) => (
  <div className="rounded-lg border border-gray-200 px-3 py-2">
    <div className="text-xs text-gray-400">{label}</div>
    <div className="text-lg font-semibold text-gray-800 mt-0.5">
      {value ?? 0}
    </div>
  </div>
);

const ApplicantScoreCard: React.FC<ApplicantScoreCardProps> = ({ score }) => {
  if (!score) return null;

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 border">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-md font-medium text-gray-800">درجات المتقدم</h3>
        <div className="text-sm text-gray-500">
          الدرجة الكلية:{" "}
          <span className="text-xl font-bold text-primary">
            {score.total_score ?? 0}
          </span>
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Part label="الجامعة" value={score.university_score} />
        <Part label="المعدل" value={score.gpa_score} />
        <Part label="الخبرة" value={score.experience_score} />
        <Part label="الاستبيان" value={score.questionnaire_score} />
      </div>
    </div>
  );
};

export default ApplicantScoreCard;
