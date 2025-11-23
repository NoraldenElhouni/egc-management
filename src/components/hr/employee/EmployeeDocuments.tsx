import React, { useRef, useState } from "react";
import { EmployeesDocuments } from "../../../types/global.type";

type DocRecord = {
  filename: string;
  url?: string;
  id?: string;
};

type EmployeeDocs = {
  cv?: DocRecord | null;
  idOrPassport?: DocRecord | null;
  diploma?: DocRecord | null;
};

interface EmployeeDocumentsProps {
  documents: EmployeesDocuments[];
  onUpload?: (docType: string, file: File) => Promise<void>;
}

const DocCard = ({
  title,
  doc,
  onAdd,
}: {
  title: string;
  doc?: DocRecord | null;
  onAdd: () => void;
}) => {
  return (
    <div className="bg-white border rounded-md p-4 flex flex-col items-start gap-3">
      <div className="w-full flex justify-between items-start">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-md bg-gray-100 flex items-center justify-center text-gray-600">
            📄
          </div>
          <div>
            <div className="text-sm font-medium text-gray-800">{title}</div>
            <div className="text-xs text-gray-400">
              {doc ? doc.filename : "لا يوجد ملف"}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {doc ? (
            <>
              <a
                href={doc.url ?? "#"}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-blue-600 hover:underline"
              >
                عرض
              </a>
              <a
                href={doc.url ?? "#"}
                download={doc.filename}
                className="text-xs text-gray-600 hover:text-gray-800"
              >
                تنزيل
              </a>
            </>
          ) : (
            <button
              onClick={onAdd}
              className="text-xs bg-primary/10 text-primary px-3 py-1 rounded-md"
            >
              إضافة
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const EmployeeDocuments = ({ documents, onUpload }: EmployeeDocumentsProps) => {
  // Map employee documents by type
  const mapDocuments = (): EmployeeDocs => {
    const result: EmployeeDocs = {
      cv: null,
      idOrPassport: null,
      diploma: null,
    };

    // Map employee_documents array
    documents?.forEach((doc) => {
      const record: DocRecord = {
        id: doc.id,
        filename: doc.doc_type,
        url: doc.url,
      };

      if (
        doc.doc_type.toLowerCase().includes("cv") ||
        doc.doc_type.toLowerCase().includes("resume") ||
        doc.doc_type.toLowerCase().includes("سيرة")
      ) {
        result.cv = record;
      } else if (
        doc.doc_type.toLowerCase().includes("id") ||
        doc.doc_type.toLowerCase().includes("passport") ||
        doc.doc_type.toLowerCase().includes("هوية") ||
        doc.doc_type.toLowerCase().includes("جواز")
      ) {
        result.idOrPassport = record;
      } else if (
        doc.doc_type.toLowerCase().includes("diploma") ||
        doc.doc_type.toLowerCase().includes("degree") ||
        doc.doc_type.toLowerCase().includes("شهادة") ||
        doc.doc_type.toLowerCase().includes("دبلوم")
      ) {
        result.diploma = record;
      }
    });

    return result;
  };

  const [docs, setDocs] = useState<EmployeeDocs>(mapDocuments());
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const pendingAddType = useRef<string | null>(null);

  function handleAddClick(type: keyof EmployeeDocs) {
    pendingAddType.current = type;
    fileInputRef.current?.click();
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    const type = pendingAddType.current as keyof EmployeeDocs | null;
    if (!type) return;

    // Create temporary local preview
    const url = URL.createObjectURL(file);
    const newDoc: DocRecord = { filename: file.name, url };
    setDocs((d) => ({ ...d, [type]: newDoc }));

    // Call upload handler if provided
    if (onUpload) {
      try {
        await onUpload(type, file);
      } catch (error) {
        console.error("Upload failed:", error);
        // Revert on error
        setDocs(mapDocuments());
      }
    }

    pendingAddType.current = null;
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">مستندات الموظف</h3>

      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleFileChange}
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <DocCard
          title="السيرة الذاتية (CV)"
          doc={docs.cv}
          onAdd={() => handleAddClick("cv")}
        />

        <DocCard
          title="جواز السفر / الهوية"
          doc={docs.idOrPassport}
          onAdd={() => handleAddClick("idOrPassport")}
        />

        <DocCard
          title="الشهادة / الدبلوم"
          doc={docs.diploma}
          onAdd={() => handleAddClick("diploma")}
        />
      </div>
    </div>
  );
};

export default EmployeeDocuments;
