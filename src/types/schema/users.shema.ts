import { z } from "zod";

// Exporting the schema so UI/form code can import it for validation
export const userSchema = z.object({
  // Authentication Details
  employeeId: z.string().min(1, "رقم الموظف مطلوب"),
  password: z.string().min(6, "كلمة المرور يجب أن تكون 6 أحرف على الأقل"),

  // Personal Information
  firstName: z.string().min(2, "الاسم الأول يجب أن يكون على الأقل حرفين"),
  lastName: z.string().min(2, "اسم العائلة يجب أن يكون على الأقل حرفين"),
  dob: z.string().min(1, "تاريخ الميلاد مطلوب"),
  nationality: z.string().optional(),

  // Contact Information
  email: z.string().email("البريد الإلكتروني غير صالح"),
  personalEmail: z
    .string()
    .email("البريد الإلكتروني الشخصي غير صالح")
    .optional(),
  phone: z.string().optional(),
  alternatePhone: z.string().optional(),
  address: z.string().optional(),
  emergencyContact: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
  emergencyContactRelation: z.string().optional(),

  // Job Details
  employeeType: z.enum(["Full-Time", "Part-Time", "Contractor", "Intern"]),
  jobTitle: z.string().min(2, "المسمى الوظيفي يجب أن يكون على الأقل حرفين"),
  department: z.string().min(2, "القسم يجب أن يكون على الأقل حرفين"),
  dateOfJoining: z.string().optional(),
  managerId: z.string().optional(),
  status: z.enum(["Active", "Inactive", "On Leave"]),
  role: z.enum([
    "Admin",
    "Manager",
    "HR",
    "Finance",
    "Sales",
    "Support",
    "Bookkeeper",
    "Accountant",
  ]),

  //Compensation & Payroll
  salaryType: z.enum(["fixed", "percentage"]),
  // Make baseSalary optional and gracefully handle empty strings / NaN when coming from form inputs.
  // Forms often submit empty inputs as "" (or react-hook-form with valueAsNumber can produce NaN).
  // Use a preprocess step to convert empty/invalid values to `undefined`, so Zod treats the field as optional.
  baseSalary: z.preprocess((val) => {
    // Treat null/undefined/empty string as undefined
    if (val === null || val === undefined) return undefined;
    if (typeof val === "string") {
      if (val.trim() === "") return undefined;
      const n = Number(val);
      return isNaN(n) ? undefined : n;
    }
    if (typeof val === "number") {
      return isNaN(val) ? undefined : val;
    }
    return undefined;
  }, z.number().optional()),

  // banking Information
  bankName: z.string().optional(),
  bankAccountNumber: z.string().optional(),

  // Education & Qualifications
  highestQualification: z.string().optional(),
  university: z.string().optional(),
  graduationYear: z.number().min(1900).max(new Date().getFullYear()).optional(),
  gpa: z.number().min(0).max(4).optional(),
  certifications: z.array(z.string()).optional(),

  // Work Experience
  previousCompanyName: z.string().optional(),
  previousJobTitle: z.string().optional(),
  yearsOfExperience: z.number().min(0).optional(),

  // Documents
  resumeUrl: z.string().url().optional(),
  personalPhotoUrl: z.string().url().optional(),
  idProofUrl: z.string().url().optional(),
});

export type UserFormValues = z.infer<typeof userSchema>;
