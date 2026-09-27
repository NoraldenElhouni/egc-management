import { useState } from "react";
import { useForm } from "react-hook-form";
import type { Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import Button from "../../ui/Button";
import { TextField } from "../../ui/inputs/TextField";
import { SelectField } from "../../ui/inputs/SelectField";
import { DateField } from "../../ui/inputs/DateField";
import { NumberField } from "../../ui/inputs/NumberField";
import { TextAreaField } from "../../ui/inputs/TextAreaField";
import {
  applicantSchema,
  ApplicantFormValues,
} from "../../../types/schema/applicant.schema";
import { createApplicant } from "../../../services/hr/applicantsService";
import { useUtils } from "../../../hooks/useUtils";
import { roleTranslations } from "../../../utils/translations";
import {
  APPLICANT_GENDER_OPTIONS,
  APPLICATION_SOURCE_OPTIONS,
  CURRENT_EMPLOYMENT_STATUS_OPTIONS,
  EXPERIENCE_LEVEL_OPTIONS,
  SPECIALIZATION_OPTIONS,
  UNIVERSITY_OPTIONS,
} from "../../../types/hr.type";

const NON_HIRING_ROLES = ["client", "contractor", "supplier"];

const ApplicantForm: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { roles } = useUtils();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ApplicantFormValues>({
    resolver: zodResolver(applicantSchema) as unknown as Resolver<ApplicantFormValues>,
  });

  const positionOptions = roles
    .filter((role) => !NON_HIRING_ROLES.includes((role.name || "").toLowerCase()))
    .map((role) => {
      const label = roleTranslations[role.code] || role.name;
      return { value: label, label };
    });

  const onSubmit = async (data: ApplicantFormValues) => {
    setLoading(true);
    try {
      const response = await createApplicant(data);
      if (!response.success) {
        alert("خطأ في تسجيل بيانات المتقدم: " + response.message);
        return;
      }
      navigate("/hr/applicants");
    } catch (error) {
      console.error("Unexpected error creating applicant:", error);
      alert("حدث خطأ غير متوقع أثناء تسجيل بيانات المتقدم.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-sm">
      <h1 className="text-2xl font-semibold mb-1">بيانات المتقدم للوظيفة</h1>
      <p className="text-sm text-gray-500 mb-4">
        يرجى تعبئة البيانات التالية بنفسك
      </p>

      <form
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
        onSubmit={handleSubmit(onSubmit)}
        noValidate
      >
        <SelectField
          id="appliedPosition"
          label="الوظيفة المتقدم عليها"
          options={positionOptions}
          register={register("appliedPosition")}
          error={errors.appliedPosition}
        />

        <TextField
          id="fullName"
          label="الاسم بالكامل"
          register={register("fullName")}
          error={errors.fullName}
        />

        <SelectField
          id="gender"
          label="الجنس"
          options={APPLICANT_GENDER_OPTIONS.map((o) => ({ ...o }))}
          register={register("gender")}
          error={errors.gender}
        />

        <DateField
          id="birthDate"
          label="تاريخ الميلاد"
          register={register("birthDate")}
          error={errors.birthDate}
        />

        <TextField
          id="phoneWhatsapp"
          label="رقم الهاتف (واتساب)"
          register={register("phoneWhatsapp")}
          error={errors.phoneWhatsapp}
        />

        <SelectField
          id="specialization"
          label="التخصص العلمي"
          options={SPECIALIZATION_OPTIONS.map((o) => ({ ...o }))}
          register={register("specialization")}
          error={errors.specialization}
        />

        <SelectField
          id="university"
          label="الجامعة / المعهد"
          options={UNIVERSITY_OPTIONS.map((o) => ({ ...o }))}
          register={register("university")}
          error={errors.university}
        />

        <TextField
          id="gpaGrade"
          label="المعدل / التقدير"
          register={register("gpaGrade")}
          error={errors.gpaGrade}
        />

        <NumberField
          id="graduationYear"
          label="سنة التخرج"
          step={1}
          register={register("graduationYear", { valueAsNumber: true })}
          error={errors.graduationYear}
        />

        <SelectField
          id="experienceLevel"
          label="سنوات الخبرة"
          options={EXPERIENCE_LEVEL_OPTIONS.map((o) => ({ ...o }))}
          register={register("experienceLevel")}
          error={errors.experienceLevel}
        />

        <SelectField
          id="currentEmploymentStatus"
          label="حالة العمل الحالية"
          options={CURRENT_EMPLOYMENT_STATUS_OPTIONS.map((o) => ({ ...o }))}
          register={register("currentEmploymentStatus")}
          error={errors.currentEmploymentStatus}
        />

        <SelectField
          id="applicationSource"
          label="كيف تقدمت للوظيفة؟ (اختياري)"
          options={APPLICATION_SOURCE_OPTIONS.map((o) => ({ ...o }))}
          register={register("applicationSource")}
          error={errors.applicationSource}
        />

        <div className="md:col-span-2">
          <TextAreaField
            id="generalNotes"
            label="ملاحظات عامة (اختياري)"
            register={register("generalNotes")}
            error={errors.generalNotes}
          />
        </div>

        <p className="md:col-span-2 text-xs text-gray-500">
          يمكن رفع السيرة الذاتية لاحقاً من صفحة المتقدم بعد التسجيل.
        </p>

        <div className="md:col-span-2 flex justify-end mt-3">
          <Button loading={loading} type="submit">
            إرسال البيانات
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ApplicantForm;
