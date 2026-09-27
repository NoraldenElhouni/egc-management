import { supabase } from "../../lib/supabaseClient";
import { resolveEmployeeNames } from "./resolveEmployeeNames";
import type {
  OverallRecommendation,
  PerformanceReviewWithRatings,
} from "../../types/hr.type";

const hrDb = () => supabase.schema("hr");

export const listReviewsForEmployee = async (employeeId: string) => {
  const { data, error } = await hrDb()
    .from("performance_reviews")
    .select("*, performance_review_ratings(*)")
    .eq("employee_id", employeeId)
    .order("reviewed_at", { ascending: false });

  if (error || !data) {
    return { data: [] as PerformanceReviewWithRatings[], error };
  }

  const namesById = await resolveEmployeeNames(
    data.map((r) => r.reviewer_employee_id),
  );

  return {
    data: data.map((r) => ({
      ...r,
      reviewer_name: r.reviewer_employee_id
        ? (namesById.get(r.reviewer_employee_id) ?? null)
        : null,
    })) as PerformanceReviewWithRatings[],
    error: null,
  };
};

export interface SubmitPerformanceReviewInput {
  employeeId: string;
  reviewerEmployeeId: string | null;
  overallRecommendation?: OverallRecommendation;
  overallNotes?: string;
  ratings: { criteriaId: string; ratingId: string; notes?: string }[];
}

export const submitPerformanceReview = async (
  input: SubmitPerformanceReviewInput,
) => {
  const { data: review, error: reviewError } = await hrDb()
    .from("performance_reviews")
    .insert({
      employee_id: input.employeeId,
      reviewer_employee_id: input.reviewerEmployeeId,
      overall_recommendation: input.overallRecommendation ?? null,
      overall_notes: input.overallNotes?.trim() || null,
    })
    .select()
    .single();

  if (reviewError || !review) {
    console.error("Error creating performance review:", reviewError);
    return {
      success: false,
      error: reviewError,
      message: "فشل في حفظ تقييم الأداء",
    };
  }

  const ratingsPayload = input.ratings.map((r) => ({
    review_id: review.id,
    criteria_id: r.criteriaId,
    rating_id: r.ratingId,
    notes: r.notes?.trim() || null,
  }));

  const { error: ratingsError } = await hrDb()
    .from("performance_review_ratings")
    .insert(ratingsPayload);

  if (ratingsError) {
    console.error("Error saving performance review ratings:", ratingsError);
    return {
      success: false,
      error: ratingsError,
      message: "فشل في حفظ درجات التقييم",
    };
  }

  return {
    success: true,
    data: review,
    message: "تم حفظ تقييم الأداء بنجاح",
  };
};
