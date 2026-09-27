import { useNavigate } from "react-router-dom";
import Button from "../../ui/Button";
import Badge from "../../ui/Badge";
import type { Applicant } from "../../../types/hr.type";
import type { UserFormValues } from "../../../types/schema/users.schema";

interface HireApplicantButtonProps {
  applicant: Applicant;
}

const HireApplicantButton: React.FC<HireApplicantButtonProps> = ({
  applicant,
}) => {
  const navigate = useNavigate();

  if (applicant.hired_employee_id) {
    return <Badge label="تم التوظيف" variant="success" dot />;
  }

  const handleHire = () => {
    const [firstName, ...rest] = applicant.full_name.trim().split(/\s+/);
    const initialValues: Partial<UserFormValues> = {
      firstName,
      lastName: rest.join(" ") || undefined,
      phone: applicant.phone_whatsapp ?? undefined,
      dob: applicant.birth_date ?? undefined,
      university: applicant.university ?? undefined,
      graduationYear: applicant.graduation_year ?? undefined,
      gender:
        applicant.gender === "male"
          ? "Male"
          : applicant.gender === "female"
            ? "Female"
            : undefined,
    };

    navigate("/hr/employees/new", {
      state: { initialValues, applicantId: applicant.id },
    });
  };

  return (
    <Button variant="success" onClick={handleHire}>
      توظيف المتقدم
    </Button>
  );
};

export default HireApplicantButton;
