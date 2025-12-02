import { useState, useRef } from "react";
import {
  deleteFileFromSupabase,
  uploadFileToSupabase,
} from "../../../utils/supabaseUpload";

interface ImageUploadFieldProps {
  id: string;
  label: string;
  value?: string;
  onChange: (url: string) => void;
  error?: { message?: string };
  bucket?: string;
  folder?: string;
  accept?: string;
  maxSizeMB?: number;
  preview?: boolean;
}

export const ImageUploadField: React.FC<ImageUploadFieldProps> = ({
  id,
  label,
  value,
  onChange,
  error,
  bucket = "uploads",
  folder = "images",
  accept = "image/*",
  maxSizeMB = 5,
  preview = true,
}) => {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxSizeMB) {
      setUploadError(`حجم الملف يجب أن يكون أقل من ${maxSizeMB}MB`);
      return;
    }

    // Validate file type
    if (accept && !file.type.match(accept.replace("*", ".*"))) {
      setUploadError("نوع الملف غير مدعوم");
      return;
    }

    setUploading(true);
    setUploadError(null);

    try {
      const url = await uploadFileToSupabase(file, bucket, folder);
      onChange(url);
    } catch (err) {
      console.error("Upload error:", err);
      setUploadError("فشل رفع الملف. يرجى المحاولة مرة أخرى.");
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    if (!value) return;

    try {
      await deleteFileFromSupabase(value, bucket);
      onChange("");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (err) {
      console.error("Delete error:", err);
      setUploadError("فشل حذف الملف");
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-sm font-medium text-gray-700">
        {label}
      </label>

      <div className="flex flex-col gap-2">
        {preview && value && (
          <div className="relative w-32 h-32 border rounded overflow-hidden">
            <img
              src={value}
              alt="Preview"
              className="w-full h-full object-cover"
            />
            <button
              type="button"
              onClick={handleRemove}
              className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600"
              title="حذف"
            >
              ×
            </button>
          </div>
        )}

        <input
          ref={fileInputRef}
          id={id}
          type="file"
          accept={accept}
          onChange={handleFileSelect}
          disabled={uploading}
          className="block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded file:border-0
            file:text-sm file:font-semibold
            file:bg-blue-50 file:text-blue-700
            hover:file:bg-blue-100
            disabled:opacity-50 disabled:cursor-not-allowed"
        />

        {uploading && (
          <span className="text-sm text-blue-600">جاري الرفع...</span>
        )}

        {uploadError && (
          <span className="text-sm text-red-600">{uploadError}</span>
        )}

        {error?.message && (
          <span className="text-sm text-red-600">{error.message}</span>
        )}

        {value && !preview && (
          <div className="flex items-center gap-2">
            <a
              href={value}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:underline"
            >
              عرض الملف
            </a>
            <button
              type="button"
              onClick={handleRemove}
              className="text-sm text-red-600 hover:underline"
            >
              حذف
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
