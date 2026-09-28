import { useState } from "react";
import {
  DndContext,
  DragEndEvent,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Plus, Trash2, X } from "lucide-react";
import Button from "../../ui/Button";
import ConfirmDialog from "../../ui/ConfirmDialog";
import SortableConfigRow from "../settings/SortableConfigRow";
import QuestionOptionsEditor from "../shared/QuestionOptionsEditor";
import { useJobRequestQuestions } from "../../../hooks/hr/useJobRequestQuestions";
import { useQuestionBank } from "../../../hooks/hr/useQuestionBank";
import { useCan } from "../../../hooks/permissions/useCan";
import {
  CHOICE_QUESTION_TYPES,
  QUESTION_TYPE_OPTIONS,
  QuestionType,
  questionTypeLabel,
} from "../../../types/hr.type";

interface JobRequestQuestionsBuilderProps {
  jobRequestId: string;
  department: string | null;
}

const JobRequestQuestionsBuilder: React.FC<JobRequestQuestionsBuilderProps> = ({
  jobRequestId,
  department,
}) => {
  const {
    questions,
    loading,
    copyFromBank,
    addFreeform,
    remove,
    reorder,
    addOption,
    editOption,
    removeOption,
  } = useJobRequestQuestions(jobRequestId);
  const { questions: bankQuestions } = useQuestionBank();
  const { can: canManage } = useCan("manage_job_requests");

  const [showBankPicker, setShowBankPicker] = useState(false);
  const [showNewForm, setShowNewForm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const [newText, setNewText] = useState("");
  const [newType, setNewType] = useState<QuestionType>("text");
  const [newRequired, setNewRequired] = useState(true);
  const [newOptions, setNewOptions] = useState<string[]>([""]);
  const [saving, setSaving] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const availableBankQuestions = bankQuestions.filter(
    (q) =>
      q.is_active &&
      (q.department === null || q.department === department) &&
      !questions.some((jq) => jq.bank_question_id === q.id),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = questions.findIndex((q) => q.id === active.id);
    const newIndex = questions.findIndex((q) => q.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    reorder(arrayMove(questions, oldIndex, newIndex));
  };

  const handleAddFreeform = async () => {
    if (!newText.trim()) return;
    setSaving(true);
    try {
      const isChoice = CHOICE_QUESTION_TYPES.includes(newType);
      const result = await addFreeform({
        questionText: newText,
        questionType: newType,
        isRequired: newRequired,
        options: isChoice
          ? newOptions.map((o) => o.trim()).filter(Boolean)
          : undefined,
      });
      if (!result.success) {
        alert(result.message ?? "فشل في إضافة السؤال");
        return;
      }
      setNewText("");
      setNewType("text");
      setNewRequired(true);
      setNewOptions([""]);
      setShowNewForm(false);
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    await remove(deleteTarget);
    setDeleteTarget(null);
  };

  const isChoiceType = CHOICE_QUESTION_TYPES.includes(newType);

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 border">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-md font-medium text-gray-800">
          استبيان المتقدمين لهذه الوظيفة
        </h3>
        {canManage && (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setShowBankPicker((s) => !s)}
            >
              {showBankPicker ? "إغلاق" : "إضافة من بنك الأسئلة"}
            </Button>
            <Button size="sm" onClick={() => setShowNewForm((s) => !s)}>
              {showNewForm ? "إلغاء" : "سؤال جديد"}
            </Button>
          </div>
        )}
      </div>

      {showBankPicker && canManage && (
        <div className="mb-4 border rounded-lg p-3 space-y-2 max-h-64 overflow-y-auto">
          {availableBankQuestions.length === 0 ? (
            <p className="text-sm text-gray-500">
              لا توجد أسئلة متاحة في بنك الأسئلة لهذا القسم.
            </p>
          ) : (
            availableBankQuestions.map((q) => (
              <div
                key={q.id}
                className="flex items-center justify-between gap-2 text-sm border-b last:border-b-0 pb-2"
              >
                <span>
                  {q.question_text}{" "}
                  <span className="text-gray-400">
                    ({questionTypeLabel(q.question_type)})
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => copyFromBank(q.id)}
                  className="text-primary hover:underline flex-shrink-0"
                >
                  إضافة
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {showNewForm && canManage && (
        <div className="mb-4 border rounded-lg p-3 space-y-3">
          <input
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            placeholder="نص السؤال"
            className="w-full rounded border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-400"
          />

          <div className="flex items-center gap-3">
            <select
              value={newType}
              onChange={(e) => setNewType(e.target.value as QuestionType)}
              className="rounded border border-gray-200 px-3 py-2 text-sm bg-white"
            >
              {QUESTION_TYPE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>

            <label className="flex items-center gap-1.5 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={newRequired}
                onChange={(e) => setNewRequired(e.target.checked)}
              />
              إجباري
            </label>
          </div>

          {isChoiceType && (
            <div className="space-y-1.5">
              {newOptions.map((opt, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    value={opt}
                    onChange={(e) =>
                      setNewOptions((prev) =>
                        prev.map((o, i) => (i === index ? e.target.value : o)),
                      )
                    }
                    placeholder={`خيار ${index + 1}`}
                    className="flex-1 rounded border border-gray-200 px-2 py-1 text-xs outline-none focus:border-gray-400"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setNewOptions((prev) => prev.filter((_, i) => i !== index))
                    }
                    className="text-red-500 hover:text-red-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => setNewOptions((prev) => [...prev, ""])}
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> إضافة خيار
              </button>
            </div>
          )}

          <div className="flex justify-end">
            <Button loading={saving} onClick={handleAddFreeform}>
              حفظ السؤال
            </Button>
          </div>
        </div>
      )}

      {loading && <div className="text-sm text-gray-500">جاري التحميل...</div>}

      {!loading && questions.length === 0 && (
        <p className="text-sm text-gray-500">لا توجد أسئلة بعد.</p>
      )}

      {canManage ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={questions.map((q) => q.id)}
            strategy={verticalListSortingStrategy}
          >
            <ul>
              {questions.map((q) => (
                <SortableConfigRow key={q.id} id={q.id}>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-900">
                        {q.question_text}
                      </span>
                      <span className="text-xs text-gray-400">
                        ({questionTypeLabel(q.question_type)})
                      </span>
                      {q.is_required && (
                        <span className="text-xs text-error">إجباري</span>
                      )}
                    </div>
                    {CHOICE_QUESTION_TYPES.includes(
                      q.question_type as QuestionType,
                    ) && (
                      <QuestionOptionsEditor
                        options={q.job_request_question_options}
                        onAdd={(text) => addOption(q.id, text)}
                        onUpdate={(id, text) => editOption(id, text)}
                        onDelete={(id) => removeOption(id)}
                      />
                    )}
                  </div>
                  <button
                    type="button"
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={() => setDeleteTarget(q.id)}
                    className="text-red-500 hover:text-red-600 flex-shrink-0"
                    title="حذف"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </SortableConfigRow>
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      ) : (
        <ul className="space-y-2">
          {questions.map((q) => (
            <li key={q.id} className="text-sm text-gray-800 border-b pb-2">
              {q.question_text}{" "}
              <span className="text-xs text-gray-400">
                ({questionTypeLabel(q.question_type)})
              </span>
              {q.is_required && (
                <span className="text-xs text-error"> — إجباري</span>
              )}
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        title="حذف السؤال"
        message="هل أنت متأكد من حذف هذا السؤال؟ سيتم حذف إجابات المتقدمين عليه أيضاً."
        confirmLabel="حذف"
        cancelLabel="إلغاء"
        confirmVariant="error"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};

export default JobRequestQuestionsBuilder;
