import { ReactNode, useEffect, useMemo, useState } from "react";
import { AlertTriangle, RotateCcw, Save } from "lucide-react";
import type { PermissionCatalogRow } from "../../types/permissions.types";
import PermissionMatrix from "./PermissionMatrix";
import { InheritedContext } from "./PermissionRow";
import {
  buildGrantDiff,
  describeChange,
  DraftMap,
  ExistingGrant,
  GrantDiff,
  GrantDraft,
  draftsFromGrants,
  validateDrafts,
} from "./permissionModel";
import Button from "../ui/Button";

// =====================================================================
// The editing shell shared by all three Phase 3 screens.
// =====================================================================
// Owns: draft state, dirty tracking, validation, the diff, the
// plain-language confirmation step, and the save/discard controls.
// Does not own: what is being edited or how it is persisted — the
// screen passes those in.
// =====================================================================

interface PermissionEditorProps {
  catalog: PermissionCatalogRow[];
  savedGrants: ExistingGrant[];
  /** e.g. "أي شخص في قسم المساحة" — used in the confirmation sentence. */
  subjectPhrase: string;
  onSave: (diff: GrantDiff) => Promise<void>;
  saving?: boolean;
  /** Screen 3 only. */
  inheritedById?: Record<string, InheritedContext>;
  showNotes?: boolean;
  /**
   * Extra content inside the confirmation dialog — the role screen puts
   * its impact preview here. Called with the diff about to be applied.
   */
  renderConfirmExtra?: (diff: GrantDiff) => ReactNode;
  /** Fired when the confirmation dialog opens, before it renders. */
  onConfirmOpen?: (diff: GrantDiff) => void;
}

export default function PermissionEditor({
  catalog,
  savedGrants,
  subjectPhrase,
  onSave,
  saving = false,
  inheritedById,
  showNotes = false,
  renderConfirmExtra,
  onConfirmOpen,
}: PermissionEditorProps) {
  const original = useMemo(
    () => draftsFromGrants(catalog, savedGrants),
    [catalog, savedGrants],
  );

  const [drafts, setDrafts] = useState<DraftMap>(original);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [showProblems, setShowProblems] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Re-seed when the saved data changes underneath (first load, or after
  // a successful save refetches).
  useEffect(() => {
    setDrafts(original);
    setShowProblems(false);
  }, [original]);

  const diff = useMemo(
    () => buildGrantDiff(catalog, original, drafts),
    [catalog, original, drafts],
  );

  const problems = useMemo(
    () => validateDrafts(catalog, drafts),
    [catalog, drafts],
  );

  const summaryLines = useMemo(
    () => describeChange(catalog, diff, subjectPhrase),
    [catalog, diff, subjectPhrase],
  );

  const handleChange = (permissionId: string, next: GrantDraft) => {
    setDrafts((prev) => ({ ...prev, [permissionId]: next }));
  };

  const handleSaveClick = () => {
    setSaveError(null);
    if (problems.length > 0) {
      setShowProblems(true);
      return;
    }
    onConfirmOpen?.(diff);
    setConfirmOpen(true);
  };

  const handleConfirm = async () => {
    try {
      await onSave(diff);
      setConfirmOpen(false);
    } catch (error) {
      setSaveError(
        error instanceof Error ? error.message : "فشل حفظ الصلاحيات",
      );
      setConfirmOpen(false);
    }
  };

  const changeCount = diff.upserts.length + diff.deletes.length;

  return (
    <div className="space-y-4">
      {/* Sticky action bar */}
      <div className="sticky top-0 z-10 bg-white border border-gray-200 rounded-xl px-4 py-3 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm">
          {diff.isEmpty ? (
            <span className="text-gray-500">لا توجد تغييرات غير محفوظة</span>
          ) : (
            <span className="text-amber-700 font-medium">
              {changeCount} تغيير غير محفوظ
            </span>
          )}
          {showProblems && problems.length > 0 && (
            <span className="flex items-center gap-1.5 text-red-600 mt-1">
              <AlertTriangle size={14} />
              {problems.length} صلاحية بحاجة إلى اختيار نطاق التطبيق قبل الحفظ
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            disabled={diff.isEmpty || saving}
            onClick={() => {
              setDrafts(original);
              setShowProblems(false);
              setSaveError(null);
            }}
          >
            <RotateCcw size={14} className="ml-1" />
            تراجع
          </Button>
          <Button
            variant="primary"
            size="sm"
            disabled={diff.isEmpty || saving}
            loading={saving}
            onClick={handleSaveClick}
          >
            <Save size={14} className="ml-1" />
            حفظ التغييرات
          </Button>
        </div>
      </div>

      {saveError && (
        <div className="border border-red-200 bg-red-50 text-red-700 rounded-lg px-4 py-3 text-sm">
          {saveError}
        </div>
      )}

      <PermissionMatrix
        catalog={catalog}
        drafts={drafts}
        onChange={handleChange}
        inheritedById={inheritedById}
        showNotes={showNotes}
        problems={showProblems ? problems : []}
        disabled={saving}
      />

      {/* Confirmation — the plain-language summary from guide 4.1 step 7 */}
      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div
            dir="rtl"
            className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[85vh] overflow-y-auto"
          >
            <div className="px-5 py-4 border-b border-gray-200">
              <h3 className="text-base font-semibold text-gray-900">
                تأكيد تغيير الصلاحيات
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                راجع أثر التغيير قبل الحفظ.
              </p>
            </div>

            <div className="px-5 py-4 space-y-3">
              {summaryLines.length === 0 ? (
                <p className="text-sm text-gray-600">
                  لا يوجد وصف لهذا التغيير.
                </p>
              ) : (
                summaryLines.map((line, index) => (
                  <p
                    key={index}
                    className="text-sm text-gray-800 leading-relaxed bg-gray-50 border border-gray-200 rounded-lg px-3 py-2"
                  >
                    {line}
                  </p>
                ))
              )}

              {renderConfirmExtra?.(diff)}
            </div>

            <div className="px-5 py-3 border-t border-gray-200 flex justify-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setConfirmOpen(false)}
                disabled={saving}
              >
                إلغاء
              </Button>
              <Button
                variant="success"
                size="sm"
                onClick={handleConfirm}
                loading={saving}
              >
                تأكيد وحفظ
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
