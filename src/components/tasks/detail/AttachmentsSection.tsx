import { useRef, useState } from "react";
import { Upload, Loader2 } from "lucide-react";
import { uploadFile } from "../../../lib/storage-client";
import AttachmentsPreview from "../../ui/AttachmentsPreview";
import type { Attachment } from "../../../hooks/tasks/useTaskDetail";

interface AttachmentsSectionProps {
  taskId: string;
  attachments: Attachment[];
  onUploaded: () => void;
}

// Drag-drop zone + grid, per clickup-task-ui. Reuses the app's existing
// attachments pipeline (storage-client.ts's uploadFile + the shared
// AttachmentsPreview grid, same one RoundDetailsPage uses) rather than a
// new upload component — see AGENTS.md's "match the local feature
// pattern" note. AttachmentsPreview has no per-item delete anywhere it's
// already used, so this doesn't add one either rather than diverging from
// the shared component's existing contract.
export default function AttachmentsSection({
  taskId,
  attachments,
  onUploaded,
}: AttachmentsSectionProps) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const upload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        await uploadFile({ file, entityType: "task", entityId: taskId, isPublic: true });
      }
      onUploaded();
    } catch (err) {
      console.error("task attachment upload failed", err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-3">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          upload(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center gap-1 rounded-xl border border-dashed px-4 py-5 text-center text-sm transition-colors ${
          dragOver ? "border-primary bg-primary-superLight" : "border-gray-200 text-gray-400 hover:border-gray-300"
        }`}
      >
        {uploading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <>
            <Upload className="h-5 w-5" />
            <span>اسحب الملفات هنا أو اضغط للاختيار</span>
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => upload(e.target.files)}
        />
      </div>

      <AttachmentsPreview attachments={attachments} />
    </div>
  );
}
