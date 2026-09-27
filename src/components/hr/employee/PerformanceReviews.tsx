import { useState } from "react";
import { FullEmployee } from "../../../types/extended.type";
import Button from "../../ui/Button";
import { TextAreaField } from "../../ui/inputs/TextAreaField";
import CriteriaRatingFields, {
  CriterionRatingValue,
} from "../shared/CriteriaRatingFields";
import { usePerformanceReviews } from "../../../hooks/hr/usePerformanceReviews";
import { useEvaluationConfig } from "../../../hooks/hr/useEvaluationConfig";
import { useCan } from "../../../hooks/permissions/useCan";
import { useAuth } from "../../../hooks/useAuth";
import {
  OVERALL_RECOMMENDATION_OPTIONS,
  OverallRecommendation,
  overallRecommendationLabel,
} from "../../../types/hr.type";

interface PerformanceReviewsProps {
  employee: FullEmployee;
  onUpdated?: () => void | Promise<void>;
}

const PerformanceReviews: React.FC<PerformanceReviewsProps> = ({
  employee,
}) => {
  const { reviews, loading, submit } = usePerformanceReviews(employee.id);
  const { criteria, ratingScale } = useEvaluationConfig("performance");
  const { can: canEvaluate } = useCan("evaluate_employee_performance");
  const { user } = useAuth();

  const [showForm, setShowForm] = useState(false);
  const [ratings, setRatings] = useState<Record<string, CriterionRatingValue>>(
    {},
  );
  const [overallRecommendation, setOverallRecommendation] = useState<
    OverallRecommendation | ""
  >("");
  const [overallNotes, setOverallNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const handleChange = (criteriaId: string, value: CriterionRatingValue) => {
    setRatings((prev) => ({ ...prev, [criteriaId]: value }));
  };

  const allRated = criteria.every((c) => ratings[c.id]?.ratingId);

  const handleSubmit = async () => {
    if (!allRated) {
      alert("يرجى تقييم جميع البنود قبل الحفظ");
      return;
    }
    setSaving(true);
    try {
      const result = await submit({
        employeeId: employee.id,
        reviewerEmployeeId: user?.id ?? null,
        overallRecommendation: overallRecommendation || undefined,
        overallNotes,
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
      setOverallRecommendation("");
      setOverallNotes("");
      setShowForm(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-md font-medium text-gray-800">تقييمات الأداء</h3>
        {canEvaluate && (
          <Button size="sm" onClick={() => setShowForm((s) => !s)}>
            {showForm ? "إلغاء" : "إضافة تقييم أداء"}
          </Button>
        )}
      </div>

      {loading && <div className="text-sm text-gray-500">جاري التحميل...</div>}

      {!loading && reviews.length === 0 && (
        <p className="text-sm text-gray-500">لا توجد تقييمات أداء بعد.</p>
      )}

      <div className="space-y-3">
        {reviews.map((review) => {
          const criteriaById = new Map(criteria.map((c) => [c.id, c]));
          const ratingById = new Map(ratingScale.map((r) => [r.id, r]));
          return (
            <div key={review.id} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-500">
                  {new Date(review.reviewed_at).toLocaleString("ar-LY")}
                  {review.reviewer_name && (
                    <span> — بواسطة {review.reviewer_name}</span>
                  )}
                </span>
                {review.overall_recommendation && (
                  <span className="text-xs px-2 py-1 rounded-full border text-gray-700 bg-gray-50 border-gray-200">
                    {overallRecommendationLabel(review.overall_recommendation)}
                  </span>
                )}
              </div>
              <ul className="text-sm text-gray-700 space-y-1">
                {review.performance_review_ratings.map((r) => (
                  <li key={r.id} className="flex justify-between gap-2">
                    <span>{criteriaById.get(r.criteria_id)?.name_ar ?? "—"}</span>
                    <span className="font-medium">
                      {ratingById.get(r.rating_id)?.label_ar ?? "—"}
                    </span>
                  </li>
                ))}
              </ul>
              {review.overall_notes && (
                <p className="text-sm text-gray-600 mt-2 pt-2 border-t whitespace-pre-wrap">
                  {review.overall_notes}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {showForm && canEvaluate && (
        <div className="border-t pt-4 space-y-4">
          <CriteriaRatingFields
            criteria={criteria}
            ratingScale={ratingScale}
            value={ratings}
            onChange={handleChange}
          />

          <div className="flex flex-col">
            <label className="mb-1 text-sm text-foreground">
              التوصية العامة (اختياري)
            </label>
            <select
              value={overallRecommendation}
              onChange={(e) =>
                setOverallRecommendation(e.target.value as OverallRecommendation)
              }
              className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">-- اختر --</option>
              {OVERALL_RECOMMENDATION_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          <TextAreaField
            id="overallNotes"
            label="ملاحظات عامة (اختياري)"
            onChange={(e) => setOverallNotes(e.target.value)}
          />

          <div className="flex justify-end">
            <Button loading={saving} onClick={handleSubmit}>
              حفظ التقييم
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PerformanceReviews;
