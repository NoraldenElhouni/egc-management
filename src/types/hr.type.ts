import type { Database } from "../lib/supabase";

export type Applicant = Database["hr"]["Tables"]["applicants"]["Row"];

export type InterviewRound = Database["hr"]["Tables"]["interview_rounds"]["Row"];

export type EvaluationCriteria =
  Database["hr"]["Tables"]["evaluation_criteria"]["Row"];
export type RatingScale = Database["hr"]["Tables"]["rating_scale"]["Row"];
export type EvaluationCategory = "interview" | "performance";

export type InterviewEvaluation =
  Database["hr"]["Tables"]["interview_evaluations"]["Row"];
export type InterviewEvaluationRating =
  Database["hr"]["Tables"]["interview_evaluation_ratings"]["Row"];

export interface InterviewEvaluationWithRatings extends InterviewEvaluation {
  interview_evaluation_ratings: InterviewEvaluationRating[];
  /** Resolved client-side from `evaluator_employee_id` — not a DB column. */
  evaluator_name?: string | null;
}

export type PerformanceReview =
  Database["hr"]["Tables"]["performance_reviews"]["Row"];
export type PerformanceReviewRating =
  Database["hr"]["Tables"]["performance_review_ratings"]["Row"];

export interface PerformanceReviewWithRatings extends PerformanceReview {
  performance_review_ratings: PerformanceReviewRating[];
  /** Resolved client-side from `reviewer_employee_id` — not a DB column. */
  reviewer_name?: string | null;
}

// ── option lists / labels for every check-constraint enum ──────────────

export const APPLICATION_STATUS_OPTIONS = [
  { value: "applied", label: "تم التقديم" },
  { value: "interviewing", label: "قيد المقابلة" },
  { value: "waitlisted", label: "قائمة الانتظار" },
  { value: "hired", label: "تم التوظيف" },
  { value: "rejected", label: "مرفوض" },
  { value: "withdrawn", label: "منسحب" },
] as const;
export type ApplicationStatus =
  (typeof APPLICATION_STATUS_OPTIONS)[number]["value"];

export const EXPERIENCE_LEVEL_OPTIONS = [
  { value: "none", label: "بدون خبرة" },
  { value: "1_3", label: "1 - 3 سنوات" },
  { value: "3_5", label: "3 - 5 سنوات" },
  { value: "5_plus", label: "أكثر من 5 سنوات" },
] as const;

// First-person wording — the applicant fills this in about themselves.
export const CURRENT_EMPLOYMENT_STATUS_OPTIONS = [
  { value: "not_working", label: "لا أعمل" },
  { value: "working", label: "أعمل حالياً" },
] as const;

// Starter lists for the applicant form's specialization/university/source
// dropdowns — placeholders until a real list is provided.
export const SPECIALIZATION_OPTIONS = [
  { value: "هندسة مدنية", label: "هندسة مدنية" },
  { value: "هندسة كهربائية", label: "هندسة كهربائية" },
  { value: "هندسة ميكانيكية", label: "هندسة ميكانيكية" },
  { value: "هندسة معمارية", label: "هندسة معمارية" },
  { value: "محاسبة", label: "محاسبة" },
  { value: "إدارة أعمال", label: "إدارة أعمال" },
  { value: "علوم حاسوب / تقنية معلومات", label: "علوم حاسوب / تقنية معلومات" },
  { value: "اقتصاد", label: "اقتصاد" },
  { value: "قانون", label: "قانون" },
  { value: "أخرى", label: "أخرى" },
] as const;

export const UNIVERSITY_OPTIONS = [
  { value: "جامعة طرابلس", label: "جامعة طرابلس" },
  { value: "جامعة بنغازي", label: "جامعة بنغازي" },
  { value: "الجامعة الأسمرية", label: "الجامعة الأسمرية" },
  { value: "جامعة مصراتة", label: "جامعة مصراتة" },
  { value: "جامعة الزاوية", label: "جامعة الزاوية" },
  { value: "جامعة سبها", label: "جامعة سبها" },
  { value: "جامعة عمر المختار", label: "جامعة عمر المختار" },
  { value: "المعهد العالي للعلوم والتقنية", label: "المعهد العالي للعلوم والتقنية" },
  { value: "أخرى", label: "أخرى" },
] as const;

export const APPLICATION_SOURCE_OPTIONS = [
  { value: "إعلان وظيفي", label: "إعلان وظيفي" },
  { value: "إحالة من موظف", label: "إحالة من موظف" },
  { value: "موقع الشركة", label: "موقع الشركة" },
  { value: "وسائل التواصل الاجتماعي", label: "وسائل التواصل الاجتماعي" },
  { value: "أخرى", label: "أخرى" },
] as const;

export const APPLICANT_GENDER_OPTIONS = [
  { value: "male", label: "ذكر" },
  { value: "female", label: "أنثى" },
] as const;

export const INTERVIEW_TYPE_OPTIONS = [
  { value: "phone", label: "هاتفية" },
  { value: "in_person", label: "حضورية" },
  { value: "technical", label: "فنية" },
  { value: "hr", label: "موارد بشرية" },
] as const;

export const INTERVIEW_ROUND_STATUS_OPTIONS = [
  { value: "scheduled", label: "مجدولة" },
  { value: "completed", label: "منتهية" },
  { value: "cancelled", label: "ملغاة" },
  { value: "no_show", label: "لم يحضر" },
] as const;
export type InterviewRoundStatus =
  (typeof INTERVIEW_ROUND_STATUS_OPTIONS)[number]["value"];

export const RECOMMENDATION_OPTIONS = [
  { value: "accepted", label: "مقبول" },
  { value: "waitlisted", label: "قائمة الانتظار" },
  { value: "rejected", label: "غير مناسب" },
] as const;
export type Recommendation = (typeof RECOMMENDATION_OPTIONS)[number]["value"];

export const OVERALL_RECOMMENDATION_OPTIONS = [
  { value: "promote", label: "ترقية" },
  { value: "maintain", label: "استمرار" },
  { value: "improve", label: "يحتاج تحسين" },
  { value: "terminate", label: "إنهاء الخدمة" },
] as const;
export type OverallRecommendation =
  (typeof OVERALL_RECOMMENDATION_OPTIONS)[number]["value"];

const labelFrom = <T extends readonly { value: string; label: string }[]>(
  options: T,
  value: string | null | undefined,
) => options.find((o) => o.value === value)?.label ?? value ?? "—";

export const applicationStatusLabel = (value: string | null | undefined) =>
  labelFrom(APPLICATION_STATUS_OPTIONS, value);
export const experienceLevelLabel = (value: string | null | undefined) =>
  labelFrom(EXPERIENCE_LEVEL_OPTIONS, value);
export const currentEmploymentStatusLabel = (
  value: string | null | undefined,
) => labelFrom(CURRENT_EMPLOYMENT_STATUS_OPTIONS, value);
export const applicantGenderLabel = (value: string | null | undefined) =>
  labelFrom(APPLICANT_GENDER_OPTIONS, value);
export const interviewTypeLabel = (value: string | null | undefined) =>
  labelFrom(INTERVIEW_TYPE_OPTIONS, value);
export const interviewRoundStatusLabel = (value: string | null | undefined) =>
  labelFrom(INTERVIEW_ROUND_STATUS_OPTIONS, value);
export const recommendationLabel = (value: string | null | undefined) =>
  labelFrom(RECOMMENDATION_OPTIONS, value);
export const overallRecommendationLabel = (value: string | null | undefined) =>
  labelFrom(OVERALL_RECOMMENDATION_OPTIONS, value);
