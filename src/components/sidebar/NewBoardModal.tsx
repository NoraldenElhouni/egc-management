import { useState } from "react";
import { X } from "lucide-react";
import {
  useCreateTaskEntities,
  useCreateZone,
  useProjectZoneOptions,
} from "../../hooks/tasks/useCreateTaskEntities";
import { useTasksSidebar } from "../../hooks/tasks/useTasksSidebar";
import { extractErrorMessage } from "../../hooks/tasks/extractErrorMessage";

// Adding a board to a space. This used to be an inline row in the sidebar's
// space tree; with the tree gone it is a small dialog opened from the space
// view's header, the Tasks home space cards, and the space settings.
//
// Same choices the inline row offered: an optional folder (or a new one),
// and — for a project space — which zone the board covers (or a new zone).

const NEW = "__new__";

export default function NewBoardModal({
  spaceId,
  onClose,
  onCreated,
}: {
  spaceId: string;
  onClose: () => void;
  /** Called with the new board's id after it is created. */
  onCreated?: (boardId: string) => void;
}) {
  const { data } = useTasksSidebar();
  const node = data ? Object.values(data.spacesByType).flat().find((n) => n.space.id === spaceId) : undefined;
  const projectId = node?.space.project_id ?? null;
  const folders = node?.folders ?? [];

  const zones = useProjectZoneOptions(projectId);
  const { createBoard, createFolder, creatingBoard } = useCreateTaskEntities();
  const { createZone } = useCreateZone();

  const [name, setName] = useState("");
  const [folderChoice, setFolderChoice] = useState(""); // "" = no folder, NEW = create one
  const [newFolderName, setNewFolderName] = useState("");
  const [zoneChoice, setZoneChoice] = useState("");
  const [newZoneName, setNewZoneName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const canSubmit =
    name.trim().length > 0 &&
    (folderChoice !== NEW || newFolderName.trim().length > 0) &&
    (zoneChoice !== NEW || newZoneName.trim().length > 0);

  const submit = async () => {
    if (!canSubmit || creatingBoard) return;
    setError(null);
    try {
      const folderId =
        folderChoice === NEW
          ? await createFolder({ spaceId, name: newFolderName.trim() })
          : folderChoice || null;
      const zoneId =
        zoneChoice === NEW && projectId
          ? (await createZone({ projectId, name: newZoneName.trim() })).id
          : zoneChoice || null;
      const boardId = await createBoard({ spaceId, folderId, name: name.trim(), zoneId });
      onClose();
      onCreated?.(boardId);
    } catch (err) {
      // (the module's mutation cache also raises its own toast for this)
      setError(extractErrorMessage(err));
    }
  };

  const fieldClass = "w-full rounded-md border border-gray-200 px-2 py-1.5 text-sm outline-none";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" dir="rtl" onMouseDown={onClose}>
      <div className="w-full max-w-sm rounded-xl bg-white p-4 shadow-2xl" onMouseDown={(e) => e.stopPropagation()}>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900">لوحة جديدة</h2>
          <button onClick={onClose} className="rounded-full p-1 text-gray-400 hover:bg-gray-100" aria-label="إغلاق">
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        <div className="space-y-3">
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") submit();
              if (e.key === "Escape") onClose();
            }}
            placeholder="اسم اللوحة"
            className={fieldClass}
          />

          {folders.length > 0 && (
            <div className="space-y-1.5">
              <label className="text-xs text-gray-500">المجلد</label>
              <select value={folderChoice} onChange={(e) => setFolderChoice(e.target.value)} className={fieldClass}>
                <option value="">بدون مجلد</option>
                {folders.map((f) => (
                  <option key={f.folder.id} value={f.folder.id}>
                    {f.folder.name}
                  </option>
                ))}
                <option value={NEW}>＋ مجلد جديد...</option>
              </select>
              {folderChoice === NEW && (
                <input
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="اسم المجلد الجديد"
                  className={fieldClass}
                />
              )}
            </div>
          )}

          {projectId && (
            <div className="space-y-1.5">
              <label className="text-xs text-gray-500">المنطقة</label>
              <select value={zoneChoice} onChange={(e) => setZoneChoice(e.target.value)} className={fieldClass}>
                <option value="">بدون منطقة</option>
                {zones.map((z) => (
                  <option key={z.id} value={z.id}>
                    {z.name}
                  </option>
                ))}
                <option value={NEW}>＋ منطقة جديدة...</option>
              </select>
              {zoneChoice === NEW && (
                <input
                  value={newZoneName}
                  onChange={(e) => setNewZoneName(e.target.value)}
                  placeholder="اسم المنطقة الجديدة"
                  className={fieldClass}
                />
              )}
            </div>
          )}

          {error && <div className="rounded-md bg-red-50 px-2.5 py-1.5 text-xs text-red-600">{error}</div>}

          <button
            onClick={submit}
            disabled={!canSubmit || creatingBoard}
            className="w-full rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-white disabled:opacity-40"
          >
            إنشاء
          </button>
        </div>
      </div>
    </div>
  );
}
