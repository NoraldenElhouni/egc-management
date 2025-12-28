import { z } from "zod";
import { optionalNumber } from "../../utils/zodHelpers";
import { emptyToUndefined } from "./helper.schema";

// Exporting the schema so UI/form code can import it for validation
export const userSchema = z.object({
  // Authentication Details
  employeeId: z.string().min(1, "رقم الموظف مطلوب"),
  password: z.string().min(6, "كلمة المرور يجب أن تكون 6 أحرف على الأقل"),

  // Personal Information
  firstName: z.string().min(2, "الاسم الأول يجب أن يكون على الأقل حرفين"),
  lastName: z.string().min(2, "اسم العائلة يجب أن يكون على الأقل حرفين"),
  dob: z.string().min(1, "تاريخ الميلاد مطلوب"),
  placeOfBirth: z.string().optional(),
  maritalStatus: z.preprocess(
    emptyToUndefined,
    z.enum(["Single", "Married", "Divorced", "Widowed"]).optional()
  ),
  bloodType: z.preprocess(
    emptyToUndefined,
    z.enum(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]).optional()
  ),
  nationality: z.string().optional(),
  gender: z.preprocess(emptyToUndefined, z.enum(["Male", "Female"]).optional()),

  // Contact Information
  email: z.string().email("البريد الإلكتروني غير صالح"),
  personalEmail: z.string().optional(),
  phone: z.string().optional(),
  alternatePhone: z.string().optional(),
  address: z.string().optional(),
  emergencyContact: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
  emergencyContactRelation: z.string().optional(),

  // Job Details
  employeeType: z.enum(["Full-Time", "Part-Time", "Contractor", "Intern"]),
  dateOfJoining: z.string().optional(),
  managerId: z.string().optional(),
  status: z.enum(["Active", "Inactive", "On Leave"]),
  roleId: z.string().optional(),
  specializationsId: z.string().min(1, "يجب اختيار تخصص"),

  //Compensation & Payroll
  salaryType: z.enum(["fixed", "percentage"]),
  // Keep baseSalary optional and normalize empty/invalid inputs
  baseSalary: optionalNumber(),

  // banking Information
  bankName: z.string().optional(),
  bankAccountNumber: z.string().optional(),

  // Education & Qualifications
  highestQualification: z.string().optional(),
  university: z.string().optional(),
  graduationYear: optionalNumber({ min: 1900, max: new Date().getFullYear() }),
  gpa: optionalNumber({ min: 0, max: 4 }),

  // Work Experience
  previousCompanyName: z.string().optional(),
  previousJobTitle: z.string().optional(),
  yearsOfExperience: optionalNumber({ min: 0 }),

  // Documents
  resumeUrl: z.string().optional(),
  personalPhotoUrl: z.string().optional(),
  idProofUrl: z.string().optional(),
});

export type UserFormValues = z.infer<typeof userSchema>;
