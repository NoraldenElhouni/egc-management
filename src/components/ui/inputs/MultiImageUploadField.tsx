import React, { useState, useRef } from "react";
import {
  deleteFileFromSupabase,
  uploadFilesToSupabase,
} from "../../../utils/supabaseUpload";

interface MultiImageUploadFieldProps {
  id: string;
  label: string;
  value?: string[];
  onChange: (urls: string[]) => void;
  error?: { message?: string };
  bucket?: string;
  folder?: string;
  accept?: string;
  maxSizeMB?: number;
  maxFiles?: number;
}

export const MultiImageUploadField: React.FC<MultiImageUploadFieldProps> = ({
  id,
  label,
  value = [],
  onChange,
  error,
  bucket = "uploads",
  folder = "images",
  accept = "image/*",
  maxSizeMB = 5,
  maxFiles = 10,
}) => {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFilesSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    // Check max files limit
    if (value.length + files.length > maxFiles) {
      setUploadError(`يمكنك رفع حتى ${maxFiles} صور فقط`);
      return;
    }

    // Validate file sizes
    for (const file of files) {
      const fileSizeMB = file.size / (1024 * 1024);
      if (fileSizeMB > maxSizeMB) {
        setUploadError(
          `حجم الملف ${file.name} يجب أن يكون أقل من ${maxSizeMB}MB`
        );
        return;
      }
    }

    setUploading(true);
    setUploadError(null);

    try {
      const urls = await uploadFilesToSupabase(files, bucket, folder);
      onChange([...value, ...urls]);

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (err) {
      console.error("Upload error:", err);
      setUploadError("فشل رفع الملفات. يرجى المحاولة مرة أخرى.");
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async (urlToRemove: string) => {
    try {
      await deleteFileFromSupabase(urlToRemove, bucket);
      onChange(value.filter((url) => url !== urlToRemove));
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

      {/* Preview Grid */}
      {value.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {value.map((url, index) => (
            <div
              key={index}
              className="relative w-full aspect-square border rounded overflow-hidden group"
            >
              <img
                src={url}
                alt={`Preview ${index + 1}`}
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => handleRemove(url)}
                className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                title="حذف"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* File Input */}
      {value.length < maxFiles && (
        <div className="flex flex-col gap-2">
          <input
            ref={fileInputRef}
            id={id}
            type="file"
            accept={accept}
            multiple
            onChange={handleFilesSelect}
            disabled={uploading}
            className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded file:border-0
              file:text-sm file:font-semibold
              file:bg-blue-50 file:text-blue-700
              hover:file:bg-blue-100
              disabled:opacity-50 disabled:cursor-not-allowed"
          />

          <span className="text-xs text-gray-500">
            {value.length} / {maxFiles} صور
          </span>
        </div>
      )}

      {uploading && (
        <span className="text-sm text-blue-600">جاري الرفع...</span>
      )}

      {uploadError && (
        <span className="text-sm text-red-600">{uploadError}</span>
      )}

      {error?.message && (
        <span className="text-sm text-red-600">{error.message}</span>
      )}
    </div>
  );
};
