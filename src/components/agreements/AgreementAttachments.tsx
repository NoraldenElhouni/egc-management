import { FileText, Paperclip, Plus } from "lucide-react";
import LoadingSpinner from "../ui/LoadingSpinner";
import { attachmentUrl, useAddAgreementFiles } from "../../hooks/agreements/useAgreements";
import type { AgreementDetail } from "../../types/agreements.types";
import { formatDate } from "../../utils/helpper";

// The agreement's attachments: photo thumbnails and PDF rows, each opening
// the file. Files can be added anytime; nothing here deletes — attachments
// are part of the agreement's history.
export default function AgreementAttachments({
  agreementId,
  attachments,
  canAdd,
}: {
  agreementId: string;
  attachments: AgreementDetail["attachments"];
  canAdd: boolean;
}) {
  const add = useAddAgreementFiles(agreementId);
  const images = attachments.filter((a) => (a.mime_type ?? "").startsWith("image/"));
  const files = attachments.filter((a) => !(a.mime_type ?? "").startsWith("image/"));

  return (
    <div className="rounded-lg border border-gray-200 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-1.5 text-sm font-semibold text-gray-700">
          <Paperclip className="w-4 h-4" /> المرفقات ({attachments.length})
        </h3>
        {canAdd && (
          <label className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-blue-200 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-50">
            {add.isPending ? <LoadingSpinner /> : <Plus className="w-3.5 h-3.5" />}
            إضافة مرفق
            <input
              type="file"
              accept="image/*,application/pdf"
              multiple
              className="hidden"
              disabled={add.isPending}
              onChange={(e) => {
                const picked = Array.from(e.target.files ?? []);
                e.target.value = "";
                if (!picked.length) return;
                add.mutate(picked, {
                  onSuccess: ({ failedFiles }) => {
                    if (failedFiles > 0) window.alert(`تعذر رفع ${failedFiles} من المرفقات`);
                  },
                });
              }}
            />
          </label>
        )}
      </div>

      {attachments.length === 0 && <p className="text-sm text-gray-400">لا توجد مرفقات بعد</p>}

      {images.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {images.map((a) => {
            const url = attachmentUrl(a.file_path);
            return (
              <a key={a.id} href={url} target="_blank" rel="noreferrer" title={a.file_name ?? ""}>
                <img src={url} alt="" className="h-20 w-20 rounded-lg object-cover border" />
              </a>
            );
          })}
        </div>
      )}

      {files.map((a) => (
        <a
          key={a.id}
          href={attachmentUrl(a.file_path)}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-3 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 hover:bg-gray-100"
        >
          <FileText className="w-5 h-5 text-red-600" />
          <span className="flex-1 truncate text-sm font-medium text-gray-800">{a.file_name ?? "ملف"}</span>
          <span className="text-xs text-gray-500">
            {a.uploaded_by_name ?? "—"} · {formatDate(a.created_at)}
          </span>
        </a>
      ))}
    </div>
  );
}
