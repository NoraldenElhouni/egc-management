import { supabase } from "../../lib/supabaseClient";
import type { ApplicationStatus } from "../../types/hr.type";
import type { ApplicantFormValues } from "../../types/schema/applicant.schema";

const hrDb = () => supabase.schema("hr");

const normalize = (v?: string | null) => {
  if (v === undefined || v === null) return null;
  const t = v.trim();
  return t === "" ? null : t;
};

export const createApplicant = async (data: ApplicantFormValues) => {
  const { data: applicant, error } = await hrDb()
    .from("applicants")
    .insert({
      full_name: data.fullName.trim(),
      gender: data.gender ?? null,
      birth_date: normalize(data.birthDate),
      phone_whatsapp: normalize(data.phoneWhatsapp),
      specialization: normalize(data.specialization),
      university: normalize(data.university),
      gpa_grade: normalize(data.gpaGrade),
      graduation_year: data.graduationYear ?? null,
      applied_position: normalize(data.appliedPosition),
      experience_level: data.experienceLevel ?? null,
      current_employment_status: data.currentEmploymentStatus ?? null,
      application_source: normalize(data.applicationSource),
      general_notes: normalize(data.generalNotes),
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating applicant:", error);
    return {
      success: false,
      error,
      message: "فشل في تسجيل بيانات المتقدم",
    };
  }

  return {
    success: true,
    data: applicant,
    message: "تم تسجيل بيانات المتقدم بنجاح",
  };
};

export const listApplicants = async () => {
  return hrDb()
    .from("applicants")
    .select("*")
    .order("created_at", { ascending: false });
};

export const getApplicant = async (id: string) => {
  return hrDb().from("applicants").select("*").eq("id", id).single();
};

export const updateApplicantStatus = async (
  id: string,
  status: ApplicationStatus,
) => {
  return hrDb()
    .from("applicants")
    .update({ application_status: status })
    .eq("id", id);
};

/** Attaches/replaces the applicant's CV, uploaded separately after they submitted their info. */
export const updateApplicantCv = async (id: string, cvFileUrl: string) => {
  return hrDb()
    .from("applicants")
    .update({ cv_file_url: cvFileUrl })
    .eq("id", id);
};

/** Links an applicant to the employee record created for them and marks them hired. */
export const linkHiredEmployee = async (
  applicantId: string,
  employeeId: string,
) => {
  return hrDb()
    .from("applicants")
    .update({ hired_employee_id: employeeId, application_status: "hired" })
    .eq("id", applicantId);
};
