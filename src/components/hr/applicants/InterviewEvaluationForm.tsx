import { useState } from "react";
import Button from "../../ui/Button";
import { TextAreaField } from "../../ui/inputs/TextAreaField";
import CriteriaRatingFields, {
  CriterionRatingValue,
} from "../shared/CriteriaRatingFields";
import { useEvaluationConfig } from "../../../hooks/hr/useEvaluationConfig";
import { useInterviewEvaluations } from "../../../hooks/hr/useInterviewEvaluations";
import { useAuth } from "../../../hooks/useAuth";
import type { InterviewRound } from "../../../types/hr.type";
import { RECOMMENDATION_OPTIONS, Recommendation } from "../../../types/hr.type";

interface InterviewEvaluationFormProps {
  applicantId: string;
  rounds: InterviewRound[];
}

const InterviewEvaluationForm: React.FC<InterviewEvaluationFormProps> = ({
  applicantId,
  rounds,
}) => {
  const { criteria, ratingScale, loading } = useEvaluationConfig("interview");
  const { submit } = useInterviewEvaluations(applicantId);
  const { user } = useAuth();

  const [ratings, setRatings] = useState<Record<string, CriterionRatingValue>>(
    {},
  );
  const [recommendation, setRecommendation] = useState<Recommendation | "">(
    "",
  );
  const [roundId, setRoundId] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const handleChange = (criteriaId: string, value: CriterionRatingValue) => {
    setRatings((prev) => ({ ...prev, [criteriaId]: value }));
  };

  const allRated = criteria.every((c) => ratings[c.id]?.ratingId);

  const handleSubmit = async () => {
    if (!recommendation || !allRated) {
      alert("يرجى تقييم جميع البنود واختيار التوصية قبل الحفظ");
      return;
    }
    setSaving(true);
    try {
      const result = await submit({
        applicantId,
        interviewRoundId: roundId || null,
        evaluatorEmployeeId: user?.id ?? null,
        recommendation,
        additionalNotes: notes,
        ratings: criteria.map((c) => ({
          criteriaId: c.id,
          ratingId: ratings[c.id].ratingId,
          notes: ratings[c.id].notes,
        })),
      });
      if (!result.success) {
        alert(result.message ?? "فشل في حفظ التقييم");
        return;
      }
      setRatings({});
      setRecommendation("");
      setNotes("");
      setRoundId("");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-sm text-gray-500">جاري التحميل...</div>;

  return (
    <div className="space-y-4">
      {rounds.length > 0 && (
        <div className="flex flex-col">
          <label className="mb-1 text-sm text-foreground">
            الجولة المرتبطة (اختياري)
          </label>
          <select
            value={roundId}
            onChange={(e) => setRoundId(e.target.value)}
            className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">-- بدون --</option>
            {rounds.map((r) => (
              <option key={r.id} value={r.id}>
                جولة {r.round_number}
              </option>
            ))}
          </select>
        </div>
      )}

      <CriteriaRatingFields
        criteria={criteria}
        ratingScale={ratingScale}
        value={ratings}
        onChange={handleChange}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col">
          <label className="mb-1 text-sm text-foreground">التوصية</label>
          <select
            value={recommendation}
            onChange={(e) => setRecommendation(e.target.value as Recommendation)}
            className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">-- اختر --</option>
            {RECOMMENDATION_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <TextAreaField
        id="additionalNotes"
        label="ملاحظات إضافية (اختياري)"
        onChange={(e) => setNotes(e.target.value)}
      />

      <div className="flex justify-end">
        <Button loading={saving} onClick={handleSubmit}>
          حفظ التقييم
        </Button>
      </div>
    </div>
  );
};

export default InterviewEvaluationForm;
