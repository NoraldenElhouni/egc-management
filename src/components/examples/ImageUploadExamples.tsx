/**
 * IMAGE UPLOAD COMPONENTS USAGE GUIDE
 *
 * This guide shows how to use the ImageUploadField and MultiImageUploadField
 * components with React Hook Form in your forms.
 */

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ImageUploadField } from "../ui/inputs/ImageUploadField";
import Button from "../ui/Button";
import { MultiImageUploadField } from "../ui/inputs/MultiImageUploadField";

// ============================================
// EXAMPLE 1: Single Image Upload
// ============================================

const singleImageSchema = z.object({
  name: z.string().min(1, "الاسم مطلوب"),
  profileImage: z.string().optional(),
});

type SingleImageFormValues = z.infer<typeof singleImageSchema>;

export const SingleImageExample: React.FC = () => {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<SingleImageFormValues>({
    resolver: zodResolver(singleImageSchema),
  });

  const profileImage = watch("profileImage");

  const onSubmit = async (data: SingleImageFormValues) => {
    console.log("Form data:", data);
    // The profileImage field will contain the Supabase public URL
    // You can save this URL to your database
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label>الاسم</label>
        <input {...register("name")} className="border p-2 rounded w-full" />
        {errors.name && (
          <span className="text-red-500 text-sm">{errors.name.message}</span>
        )}
      </div>

      <ImageUploadField
        id="profileImage"
        label="الصورة الشخصية"
        value={profileImage}
        onChange={(url) => setValue("profileImage", url)}
        error={errors.profileImage}
        bucket="uploads"
        folder="profiles"
        maxSizeMB={5}
        preview={true}
      />

      <Button type="submit">إرسال</Button>
    </form>
  );
};

// ============================================
// EXAMPLE 2: Multiple Images Upload
// ============================================

const multiImageSchema = z.object({
  title: z.string().min(1, "العنوان مطلوب"),
  description: z.string().optional(),
  images: z.array(z.string()).optional(),
});

type MultiImageFormValues = z.infer<typeof multiImageSchema>;

export const MultiImageExample: React.FC = () => {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<MultiImageFormValues>({
    resolver: zodResolver(multiImageSchema),
    defaultValues: {
      images: [],
    },
  });

  const images = watch("images") || [];

  const onSubmit = async (data: MultiImageFormValues) => {
    console.log("Form data:", data);
    // The images field will contain an array of Supabase public URLs
    // You can save these URLs to your database
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label>العنوان</label>
        <input {...register("title")} className="border p-2 rounded w-full" />
        {errors.title && (
          <span className="text-red-500 text-sm">{errors.title.message}</span>
        )}
      </div>

      <div>
        <label>الوصف</label>
        <textarea
          {...register("description")}
          className="border p-2 rounded w-full"
        />
      </div>

      <MultiImageUploadField
        id="images"
        label="الصور"
        value={images}
        onChange={(urls) => setValue("images", urls)}
        error={errors.images}
        bucket="uploads"
        folder="gallery"
        maxSizeMB={5}
        maxFiles={10}
      />

      <Button type="submit">إرسال</Button>
    </form>
  );
};

// ============================================
// EXAMPLE 3: Mixed Form (Both Types)
// ============================================

const employeeSchema = z.object({
  firstName: z.string().min(1, "الاسم مطلوب"),
  lastName: z.string().min(1, "اسم العائلة مطلوب"),
  email: z.string().email("البريد الإلكتروني غير صالح"),
  personalPhotoUrl: z.string().optional(),
  idProofUrl: z.string().optional(),
  resumeUrl: z.string().optional(),
  certificateUrls: z.array(z.string()).optional(),
});

type EmployeeFormValues = z.infer<typeof employeeSchema>;

export const EmployeeFormExample: React.FC = () => {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      certificateUrls: [],
    },
  });

  const personalPhotoUrl = watch("personalPhotoUrl");
  const idProofUrl = watch("idProofUrl");
  const resumeUrl = watch("resumeUrl");
  const certificateUrls = watch("certificateUrls") || [];

  const onSubmit = async (data: EmployeeFormValues) => {
    console.log("Employee data:", data);

    // Example of saving to database:
    // const response = await createEmployee({
    //   ...data,
    //   personalPhotoUrl: data.personalPhotoUrl,
    //   idProofUrl: data.idProofUrl,
    //   resumeUrl: data.resumeUrl,
    //   certificateUrls: data.certificateUrls,
    // });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-2xl">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label>الاسم الأول</label>
          <input
            {...register("firstName")}
            className="border p-2 rounded w-full"
          />
          {errors.firstName && (
            <span className="text-red-500 text-sm">
              {errors.firstName.message}
            </span>
          )}
        </div>

        <div>
          <label>اسم العائلة</label>
          <input
            {...register("lastName")}
            className="border p-2 rounded w-full"
          />
          {errors.lastName && (
            <span className="text-red-500 text-sm">
              {errors.lastName.message}
            </span>
          )}
        </div>
      </div>

      <div>
        <label>البريد الإلكتروني</label>
        <input
          {...register("email")}
          type="email"
          className="border p-2 rounded w-full"
        />
        {errors.email && (
          <span className="text-red-500 text-sm">{errors.email.message}</span>
        )}
      </div>

      {/* Single image uploads */}
      <ImageUploadField
        id="personalPhotoUrl"
        label="الصورة الشخصية"
        value={personalPhotoUrl}
        onChange={(url) => setValue("personalPhotoUrl", url)}
        error={errors.personalPhotoUrl}
        bucket="uploads"
        folder="employees/photos"
        accept="image/*"
        maxSizeMB={5}
        preview={true}
      />

      <ImageUploadField
        id="idProofUrl"
        label="صورة الهوية"
        value={idProofUrl}
        onChange={(url) => setValue("idProofUrl", url)}
        error={errors.idProofUrl}
        bucket="uploads"
        folder="employees/documents"
        accept="image/*,application/pdf"
        maxSizeMB={10}
        preview={false}
      />

      <ImageUploadField
        id="resumeUrl"
        label="السيرة الذاتية (PDF)"
        value={resumeUrl}
        onChange={(url) => setValue("resumeUrl", url)}
        error={errors.resumeUrl}
        bucket="uploads"
        folder="employees/resumes"
        accept="application/pdf"
        maxSizeMB={10}
        preview={false}
      />

      {/* Multiple images upload */}
      <MultiImageUploadField
        id="certificateUrls"
        label="الشهادات"
        value={certificateUrls}
        onChange={(urls) => setValue("certificateUrls", urls)}
        error={errors.certificateUrls}
        bucket="uploads"
        folder="employees/certificates"
        accept="image/*,application/pdf"
        maxSizeMB={10}
        maxFiles={5}
      />

      <Button type="submit">حفظ البيانات</Button>
    </form>
  );
};

// ============================================
// NOTES:
// ============================================
/*
 * 1. BUCKET SETUP:
 *    - Make sure to create a bucket in Supabase Storage (e.g., "uploads")
 *    - Set the bucket to "public" if you want direct access to URLs
 *    - Configure storage policies for insert/delete operations
 *
 * 2. STORAGE POLICIES:
 *    You'll need to set up policies in Supabase:
 *
 *    -- Allow authenticated users to upload
 *    CREATE POLICY "Authenticated users can upload"
 *    ON storage.objects FOR INSERT
 *    TO authenticated
 *    WITH CHECK (bucket_id = 'uploads');
 *
 *    -- Allow authenticated users to delete their uploads
 *    CREATE POLICY "Users can delete their uploads"
 *    ON storage.objects FOR DELETE
 *    TO authenticated
 *    USING (bucket_id = 'uploads');
 *
 *    -- Allow public read access
 *    CREATE POLICY "Public read access"
 *    ON storage.objects FOR SELECT
 *    TO public
 *    USING (bucket_id = 'uploads');
 *
 * 3. COMPONENT PROPS:
 *    - bucket: The Supabase storage bucket name
 *    - folder: Subfolder within the bucket for organization
 *    - accept: File types to accept (e.g., "image/*", "application/pdf")
 *    - maxSizeMB: Maximum file size in megabytes
 *    - maxFiles: (MultiImageUploadField only) Maximum number of files
 *    - preview: (ImageUploadField only) Show image preview
 *
 * 4. SAVING TO DATABASE:
 *    The components return Supabase public URLs as strings.
 *    Save these URLs in your database columns:
 *    - Single image: VARCHAR or TEXT column
 *    - Multiple images: TEXT[] (array) or JSONB column
 */
