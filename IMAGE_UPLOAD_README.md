# Image Upload Components for Supabase

This package provides reusable React components for uploading images and files to Supabase Storage, integrated with React Hook Form.

## Components

### 1. ImageUploadField

A single image/file upload component with preview functionality.

### 2. MultiImageUploadField

A multiple images upload component with grid preview.

## Files Created

```
src/
├── utils/
│   └── supabaseUpload.ts          # Utility functions for Supabase uploads
├── components/
│   ├── ui/
│   │   └── inputs/
│   │       ├── ImageUploadField.tsx      # Single image upload component
│   │       └── MultiImageUploadField.tsx # Multiple images upload component
│   └── examples/
│       └── ImageUploadExamples.tsx      # Usage examples
```

## Setup

### 1. Create Supabase Storage Bucket

Go to your Supabase dashboard and create a storage bucket:

1. Navigate to Storage
2. Click "New bucket"
3. Name it "uploads" (or any name you prefer)
4. Make it **public** for direct URL access
5. Click "Save"

### 2. Set Storage Policies

Run these SQL commands in your Supabase SQL editor:

```sql
-- Allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'uploads');

-- Allow authenticated users to delete their files
CREATE POLICY "Users can delete their uploads"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'uploads');

-- Allow public read access
CREATE POLICY "Public read access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'uploads');
```

## Usage

### Basic Single Image Upload

```tsx
import { ImageUploadField } from "@/components/ui/inputs/ImageUploadField";
import { useForm } from "react-hook-form";

function MyForm() {
  const { setValue, watch } = useForm();
  const photoUrl = watch("photoUrl");

  return (
    <ImageUploadField
      id="photoUrl"
      label="صورة شخصية"
      value={photoUrl}
      onChange={(url) => setValue("photoUrl", url)}
      bucket="uploads"
      folder="profiles"
      maxSizeMB={5}
    />
  );
}
```

### Multiple Images Upload

```tsx
import { MultiImageUploadField } from "@/components/ui/inputs/MultiImageUploadField";
import { useForm } from "react-hook-form";

function MyForm() {
  const { setValue, watch } = useForm({
    defaultValues: { images: [] },
  });
  const images = watch("images") || [];

  return (
    <MultiImageUploadField
      id="images"
      label="صور المشروع"
      value={images}
      onChange={(urls) => setValue("images", urls)}
      bucket="uploads"
      folder="projects"
      maxSizeMB={5}
      maxFiles={10}
    />
  );
}
```

### Integrating with Your NewEmployeeForm

Here's how to add image upload to your existing form:

```tsx
// In NewEmployeeForm.tsx

import { ImageUploadField } from "../../ui/inputs/ImageUploadField";
import { MultiImageUploadField } from "../../ui/inputs/MultiImageUploadField";

// Watch the values
const personalPhotoUrl = watch("personalPhotoUrl");
const idProofUrl = watch("idProofUrl");
const resumeUrl = watch("resumeUrl");

// Add to Step 1 (Personal Info):
<ImageUploadField
  id="personalPhotoUrl"
  label="الصورة الشخصية (اختياري)"
  value={personalPhotoUrl}
  onChange={(url) => setValue("personalPhotoUrl", url)}
  error={errors.personalPhotoUrl}
  bucket="uploads"
  folder="employees/photos"
  maxSizeMB={5}
  preview={true}
/>

// Add to Step 4 (Documents):
<ImageUploadField
  id="resumeUrl"
  label="رابط السيرة الذاتية (اختياري)"
  value={resumeUrl}
  onChange={(url) => setValue("resumeUrl", url)}
  error={errors.resumeUrl}
  bucket="uploads"
  folder="employees/resumes"
  accept="application/pdf,image/*"
  maxSizeMB={10}
  preview={false}
/>

<ImageUploadField
  id="idProofUrl"
  label="رابط إثبات الهوية (اختياري)"
  value={idProofUrl}
  onChange={(url) => setValue("idProofUrl", url)}
  error={errors.idProofUrl}
  bucket="uploads"
  folder="employees/documents"
  accept="image/*,application/pdf"
  maxSizeMB={10}
  preview={false}
/>
```

## Component Props

### ImageUploadField Props

| Prop      | Type                  | Default    | Description                       |
| --------- | --------------------- | ---------- | --------------------------------- |
| id        | string                | required   | Unique identifier for the input   |
| label     | string                | required   | Label text to display             |
| value     | string                | undefined  | Current file URL                  |
| onChange  | (url: string) => void | required   | Callback when file is uploaded    |
| error     | { message?: string }  | undefined  | Error object from form validation |
| bucket    | string                | "uploads"  | Supabase storage bucket name      |
| folder    | string                | "images"   | Subfolder within bucket           |
| accept    | string                | "image/\*" | Accepted file types               |
| maxSizeMB | number                | 5          | Maximum file size in MB           |
| preview   | boolean               | true       | Show image preview                |

### MultiImageUploadField Props

| Prop      | Type                     | Default    | Description                       |
| --------- | ------------------------ | ---------- | --------------------------------- |
| id        | string                   | required   | Unique identifier for the input   |
| label     | string                   | required   | Label text to display             |
| value     | string[]                 | []         | Array of current file URLs        |
| onChange  | (urls: string[]) => void | required   | Callback when files are uploaded  |
| error     | { message?: string }     | undefined  | Error object from form validation |
| bucket    | string                   | "uploads"  | Supabase storage bucket name      |
| folder    | string                   | "images"   | Subfolder within bucket           |
| accept    | string                   | "image/\*" | Accepted file types               |
| maxSizeMB | number                   | 5          | Maximum file size in MB           |
| maxFiles  | number                   | 10         | Maximum number of files           |

## Utility Functions

The `supabaseUpload.ts` file provides these functions:

### uploadFileToSupabase

```tsx
uploadFileToSupabase(file: File, bucket?: string, folder?: string): Promise<string>
```

Uploads a single file and returns the public URL.

### uploadFilesToSupabase

```tsx
uploadFilesToSupabase(files: File[], bucket?: string, folder?: string): Promise<string[]>
```

Uploads multiple files and returns an array of public URLs.

### deleteFileFromSupabase

```tsx
deleteFileFromSupabase(url: string, bucket?: string): Promise<void>
```

Deletes a file from Supabase storage using its public URL.

## Database Schema

To store uploaded URLs in your database:

### Single Image

```sql
ALTER TABLE employees
ADD COLUMN personal_photo_url TEXT,
ADD COLUMN id_proof_url TEXT,
ADD COLUMN resume_url TEXT;
```

### Multiple Images

```sql
ALTER TABLE projects
ADD COLUMN image_urls TEXT[];  -- PostgreSQL array

-- OR use JSONB
ADD COLUMN image_urls JSONB;
```

## File Organization

The components automatically organize files by folder:

```
uploads/
├── employees/
│   ├── photos/
│   │   └── 1701456789_123456.jpg
│   ├── documents/
│   │   └── 1701456790_654321.pdf
│   └── resumes/
│       └── 1701456791_789012.pdf
└── projects/
    └── 1701456792_345678.jpg
```

## Supported File Types

- Images: jpg, jpeg, png, gif, webp, svg
- Documents: pdf
- Custom: Set the `accept` prop to any MIME type

## Error Handling

The components handle these errors automatically:

- File size exceeds limit
- Invalid file type
- Upload failures
- Network errors

Errors are displayed in Arabic below the input field.

## Features

✅ **Drag & drop support** (native file input)  
✅ **Image preview** with remove button  
✅ **Multiple file uploads** with grid layout  
✅ **File size validation**  
✅ **File type validation**  
✅ **Automatic cleanup** when removing images  
✅ **Loading states** during upload  
✅ **Error messages** in Arabic  
✅ **React Hook Form** integration  
✅ **TypeScript** support

## Styling

The components use Tailwind CSS classes. Customize them by modifying the className props or creating wrapper components.

## Notes

1. Make sure your Supabase bucket is set to **public** for direct URL access
2. If using a **private** bucket, you'll need to generate signed URLs
3. The components automatically generate unique filenames to avoid conflicts
4. Files are uploaded immediately when selected (no need to submit the form first)
5. Removing an image also deletes it from Supabase storage

## Troubleshooting

### "Unable to resolve path to module"

Make sure the file paths are correct relative to your component location.

### Upload fails silently

Check your Supabase storage policies and ensure the bucket exists.

### "Invalid file URL" when deleting

Ensure the bucket name matches the one used during upload.

### Large files timing out

Increase `maxSizeMB` or compress images before upload.

## Example in NewEmployeeForm

See `ImageUploadExamples.tsx` for complete working examples that you can copy and adapt to your forms.
