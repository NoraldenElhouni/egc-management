import { useState } from "react";
import { Plus, FileText, Calendar, Eye, Loader2 } from "lucide-react";
import { supabase } from "../../../lib/supabaseClient";
import { EmployeesDocuments } from "../../../types/global.type";
import { deleteFileFromSupabase } from "../../../utils/supabaseUpload";
import { ImageUploadField } from "../../ui/inputs/ImageUploadField";
import { formatDate } from "../../../utils/helpper";

function AddDocumentCard({
  employeeId,
  empId,
  onCreated,
}: {
  employeeId: string;
  empId: string;
  onCreated: () => void | Promise<void>;
}) {
  const [docType, setDocType] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [adding, setAdding] = useState(false);

  const bucket = "employees";
  const folder = employeeId;

  const handleSave = async () => {
    const trimmedType = docType.trim();
    if (!trimmedType || !fileUrl) return;

    setAdding(true);
    try {
      const {
        data: { user },
        error: userErr,
      } = await supabase.auth.getUser();

      if (userErr) throw userErr;

      const payload = {
        employee_id: empId,
        doc_type: trimmedType,
        url: fileUrl,
        uploaded_by: user?.id ?? null,
        created_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("employee_documents")
        .insert(payload);
      if (error) throw error;

      setDocType("");
      setFileUrl("");
      await onCreated();

      try {
        new Notification("ملف الموظف", { body: "تم إضافة المستند بنجاح" });
      } catch {
        // ignore if Notification not available/permission blocked
      }
    } catch (err) {
      console.error("Error creating document:", err);
    } finally {
      setAdding(false);
    }
  };

  const handleCancel = async () => {
    if (fileUrl) {
      try {
        await deleteFileFromSupabase(fileUrl, bucket);
      } catch (e) {
        console.error("Failed to delete uploaded temp file:", e);
      }
    }
    setDocType("");
    setFileUrl("");
  };

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-dashed border-blue-300 rounded-xl p-6 hover:border-blue-400 transition-colors">
      <div className="flex items-center gap-2 mb-4">
        <Plus className="w-5 h-5 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-800">
          إضافة مستند جديد
        </h3>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            نوع المستند
          </label>
          <input
            value={docType}
            onChange={(e) => setDocType(e.target.value)}
            placeholder="مثال: عقد عمل، هوية وطنية، شهادة"
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
            disabled={adding}
          />
        </div>

        <div>
          <ImageUploadField
            id={`new-doc-${employeeId}`}
            label="رفع المستند"
            value={fileUrl}
            onChange={(url) => setFileUrl(url)}
            bucket={bucket}
            folder={folder}
            maxSizeMB={10}
            disabled={adding}
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={handleSave}
            disabled={!docType.trim() || !fileUrl || adding}
            className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm hover:shadow-md"
          >
            {adding ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                جاري الحفظ...
              </span>
            ) : (
              "حفظ المستند"
            )}
          </button>

          <button
            type="button"
            onClick={handleCancel}
            disabled={adding}
            className="px-4 py-2.5 bg-white hover:bg-gray-50 text-gray-700 font-medium rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            إلغاء
          </button>
        </div>
      </div>
    </div>
  );
}

interface EmployeeDocumentsProps {
  employeeId: string;
  empId: string;
  documents: EmployeesDocuments[];
  onUpdated: () => void | Promise<void>;
}

const EmployeeDocuments = ({
  employeeId,
  empId,
  documents,
  onUpdated,
}: EmployeeDocumentsProps) => {
  const [savingId, setSavingId] = useState<string | null>(null);

  const bucket = "employees";
  const folder = employeeId;

  const handleChangeUrl = async (docId: string, newUrl: string) => {
    setSavingId(docId);
    try {
      const {
        data: { user },
        error: userErr,
      } = await supabase.auth.getUser();
      if (userErr) throw userErr;

      const existing = documents.find((d) => d.id === docId);
      const prevUrl = existing?.url ?? "";

      const { error } = await supabase
        .from("employee_documents")
        .update({ url: newUrl, uploaded_by: user?.id ?? null })
        .eq("id", docId);

      if (error) throw error;

      if (prevUrl && prevUrl !== newUrl) {
        try {
          await deleteFileFromSupabase(prevUrl, bucket);
        } catch (e) {
          console.error("Failed removing old file:", e);
        }
      }

      await onUpdated();

      try {
        new Notification("ملف الموظف", { body: "تم حفظ الملف بنجاح" });
      } catch {
        // ignore
      }
    } catch (err) {
      console.error("Error saving document url:", err);
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      {documents.length > 0 && (
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <FileText className="w-5 h-5 text-gray-600" />
            المستندات المرفقة
          </h2>
          <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
            {documents.length} مستند
          </span>
        </div>
      )}

      {/* Documents List */}
      {documents.length > 0 ? (
        <div className="grid gap-4">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-lg transition-shadow"
            >
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                {/* Document Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <FileText className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-semibold text-gray-900 truncate">
                        {doc.doc_type}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-500">
                          {formatDate(doc.created_at)}
                        </span>
                      </div>

                      {doc.url && (
                        <a
                          href={doc.url}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="inline-flex items-center gap-2 mt-3 px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                          عرض الملف
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                {/* Upload Field */}
                <div className="w-full lg:w-96">
                  <ImageUploadField
                    id={`doc-${doc.id}`}
                    label="تحديث الملف"
                    value={doc.url ?? ""}
                    onChange={(url) => handleChangeUrl(doc.id, url)}
                    bucket={bucket}
                    folder={folder}
                    preview={false}
                    disabled={savingId === doc.id}
                    maxSizeMB={10}
                  />
                  {savingId === doc.id && (
                    <div className="flex items-center gap-2 mt-2 text-sm text-blue-600">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      جاري الحفظ...
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
          <FileText className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600 font-medium mb-1">لا توجد مستندات</p>
          <p className="text-sm text-gray-500">قم بإضافة مستند جديد أدناه</p>
        </div>
      )}

      {/* Add New Document Card */}
      <AddDocumentCard
        employeeId={employeeId}
        onCreated={onUpdated}
        empId={empId}
      />
    </div>
  );
};

export default EmployeeDocuments;
