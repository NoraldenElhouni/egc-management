import {
  FileText,
  FileImage,
  FileSpreadsheet,
  FileArchive,
  Eye,
  Download,
} from "lucide-react";
import { supabase } from "../../lib/supabaseClient";

export type Attachment = {
  created_at: string;
  entity_id: string;
  entity_type: string;
  file_name: string | null;
  file_path: string;
  file_size: number | null;
  id: string;
  mime_type: string | null;
  title: string;
  uploaded_by: string;
};

interface Props {
  attachments: Attachment[];
  bucket?: string;
}

const getFileIcon = (mime?: string | null) => {
  if (!mime) return <FileText className="w-6 h-6 text-gray-500" />;

  if (mime.startsWith("image/")) {
    return <FileImage className="w-6 h-6 text-blue-500" />;
  }

  if (mime.includes("pdf")) {
    return <FileText className="w-6 h-6 text-red-500" />;
  }

  if (
    mime.includes("spreadsheet") ||
    mime.includes("excel") ||
    mime.includes("csv")
  ) {
    return <FileSpreadsheet className="w-6 h-6 text-green-500" />;
  }

  if (mime.includes("zip") || mime.includes("rar")) {
    return <FileArchive className="w-6 h-6 text-yellow-500" />;
  }

  return <FileText className="w-6 h-6 text-gray-500" />;
};

const getPublicUrl = (bucket: string, path: string) => {
  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
};

const formatBytes = (bytes?: number | null) => {
  if (!bytes) return "—";

  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;

  return `${(kb / 1024).toFixed(1)} MB`;
};

const AttachmentsPreview = ({ attachments, bucket = "attachments" }: Props) => {
  if (!attachments?.length) {
    return (
      <div className="text-sm text-gray-400 text-center py-6 border rounded-xl border-dashed">
        لا توجد مرفقات
      </div>
    );
  }

  const handleDownload = async (file: Attachment) => {
    const url = getPublicUrl(bucket, file.file_path);

    const res = await fetch(url);
    const blob = await res.blob();

    const blobUrl = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = file.file_name ?? "file";

    document.body.appendChild(a);
    a.click();

    document.body.removeChild(a);
    window.URL.revokeObjectURL(blobUrl);
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {attachments.map((file) => {
        const url = getPublicUrl(bucket, file.file_path);
        const isImage = file.mime_type?.startsWith("image/");

        return (
          <div
            key={file.id}
            className="border rounded-2xl overflow-hidden bg-white shadow-sm hover:shadow-md transition"
          >
            {/* PREVIEW */}
            <div className="h-44 bg-gray-100 flex items-center justify-center overflow-hidden">
              {isImage ? (
                <img
                  src={url}
                  className="w-full h-full object-cover hover:scale-105 transition"
                  alt={file.title}
                />
              ) : (
                <div className="flex flex-col items-center gap-2 text-gray-500">
                  {getFileIcon(file.mime_type)}
                  <span className="text-xs text-center px-2">
                    {file.file_name}
                  </span>
                </div>
              )}
            </div>

            {/* CONTENT */}
            <div className="p-3 space-y-2">
              <h3 className="text-sm font-medium truncate">{file.title}</h3>

              <p className="text-xs text-gray-500 truncate">{file.file_name}</p>

              <div className="flex justify-between text-xs text-gray-400">
                <span>{formatBytes(file.file_size)}</span>
                <span>{new Date(file.created_at).toLocaleDateString()}</span>
              </div>

              {/* ACTIONS */}
              <div className="flex gap-2 pt-2">
                <a
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 flex items-center justify-center gap-1 py-1.5 border rounded-lg text-xs hover:bg-gray-50"
                >
                  <Eye className="w-4 h-4" />
                  عرض
                </a>

                <button
                  onClick={() => handleDownload(file)}
                  className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-blue-600 text-white rounded-lg text-xs hover:bg-blue-700"
                >
                  <Download className="w-4 h-4" />
                  تنزيل
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default AttachmentsPreview;
