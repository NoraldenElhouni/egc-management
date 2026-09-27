import type { EvaluationCriteria, RatingScale } from "../../../types/hr.type";

export interface CriterionRatingValue {
  ratingId: string;
  notes?: string;
}

interface CriteriaRatingFieldsProps {
  criteria: EvaluationCriteria[];
  ratingScale: RatingScale[];
  value: Record<string, CriterionRatingValue>;
  onChange: (criteriaId: string, value: CriterionRatingValue) => void;
}

/**
 * One row per active evaluation criterion, each with a rating-scale picker
 * and an optional note. Shared between the interview-evaluation form and
 * the employee performance-review form — same shape, different category.
 */
const CriteriaRatingFields: React.FC<CriteriaRatingFieldsProps> = ({
  criteria,
  ratingScale,
  value,
  onChange,
}) => {
  if (criteria.length === 0) {
    return (
      <p className="text-sm text-gray-500">
        لا توجد بنود تقييم فعّالة لهذا النوع بعد.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {criteria.map((criterion) => {
        const current = value[criterion.id];
        return (
          <div
            key={criterion.id}
            className="border rounded-lg p-3 flex flex-col gap-2"
          >
            <span className="text-sm font-medium text-foreground">
              {criterion.name_ar}
            </span>

            <div className="flex flex-wrap gap-2">
              {ratingScale.map((rating) => (
                <button
                  key={rating.id}
                  type="button"
                  onClick={() =>
                    onChange(criterion.id, {
                      ratingId: rating.id,
                      notes: current?.notes,
                    })
                  }
                  className={`px-3 py-1.5 rounded-full text-sm border transition ${
                    current?.ratingId === rating.id
                      ? "bg-primary text-white border-primary"
                      : "bg-white text-foreground border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  {rating.label_ar}
                </button>
              ))}
            </div>

            <input
              type="text"
              placeholder="ملاحظات (اختياري)"
              value={current?.notes ?? ""}
              onChange={(e) =>
                onChange(criterion.id, {
                  ratingId: current?.ratingId ?? "",
                  notes: e.target.value,
                })
              }
              className="border rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        );
      })}
    </div>
  );
};

export default CriteriaRatingFields;
