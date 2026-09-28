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
import { Plus, X, EyeOff, Eye } from "lucide-react";
import SortableConfigRow from "./SortableConfigRow";
import QuestionOptionsEditor from "../shared/QuestionOptionsEditor";
import { useQuestionBank } from "../../../hooks/hr/useQuestionBank";
import { useDepartments } from "../../../hooks/permissions/useDepartments";
import {
  CHOICE_QUESTION_TYPES,
  QUESTION_TYPE_OPTIONS,
  QuestionType,
  questionTypeLabel,
} from "../../../types/hr.type";

const ALL_FILTER = "__all__";
const GENERAL_FILTER = "__general__";

const QuestionBankEditor: React.FC = () => {
  const {
    questions,
    loading,
    create,
    toggleActive,
    reorder,
    addOption,
    editOption,
    removeOption,
  } = useQuestionBank();
  const { data: departments = [] } = useDepartments();

  const [filter, setFilter] = useState(ALL_FILTER);
  const [showForm, setShowForm] = useState(false);
  const [newDepartment, setNewDepartment] = useState("");
  const [newText, setNewText] = useState("");
  const [newType, setNewType] = useState<QuestionType>("text");
  const [newRequiredDefault, setNewRequiredDefault] = useState(true);
  const [newOptions, setNewOptions] = useState<string[]>([""]);
  const [saving, setSaving] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const filteredQuestions = questions.filter((q) => {
    if (filter === ALL_FILTER) return true;
    if (filter === GENERAL_FILTER) return q.department === null;
    return q.department === filter;
  });

  const isChoiceType = CHOICE_QUESTION_TYPES.includes(newType);

  const handleAdd = async () => {
    if (!newText.trim()) return;
    setSaving(true);
    try {
      const result = await create({
        department: newDepartment || null,
        questionText: newText,
        questionType: newType,
        isRequiredDefault: newRequiredDefault,
        options: isChoiceType
          ? newOptions.map((o) => o.trim()).filter(Boolean)
          : undefined,
      });
      if (!result.success) {
        alert(result.message ?? "فشل في إضافة السؤال");
        return;
      }
      setNewDepartment("");
      setNewText("");
      setNewType("text");
      setNewRequiredDefault(true);
      setNewOptions([""]);
      setShowForm(false);
    } finally {
      setSaving(false);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    if (filter !== ALL_FILTER) return; // reorder only makes sense across the whole bank
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = questions.findIndex((q) => q.id === active.id);
    const newIndex = questions.findIndex((q) => q.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    reorder(arrayMove(questions, oldIndex, newIndex));
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white"
        >
          <option value={ALL_FILTER}>كل الأقسام</option>
          <option value={GENERAL_FILTER}>عام (لكل الأقسام)</option>
          {departments.map((d) => (
            <option key={d.id} value={d.name_ar || d.name}>
              {d.name_ar || d.name}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={() => setShowForm((s) => !s)}
          className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-white hover:bg-primary-dark transition"
        >
          <Plus className="w-4 h-4" /> {showForm ? "إلغاء" : "إضافة سؤال"}
        </button>
      </div>

      {showForm && (
        <div className="border rounded-lg p-3 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <select
              value={newDepartment}
              onChange={(e) => setNewDepartment(e.target.value)}
              className="rounded border border-gray-200 px-3 py-2 text-sm bg-white"
            >
              <option value="">عام (لكل الأقسام)</option>
              {departments.map((d) => (
                <option key={d.id} value={d.name_ar || d.name}>
                  {d.name_ar || d.name}
                </option>
              ))}
            </select>

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
          </div>

          <input
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            placeholder="نص السؤال"
            className="w-full rounded border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-400"
          />

          <label className="flex items-center gap-1.5 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={newRequiredDefault}
              onChange={(e) => setNewRequiredDefault(e.target.checked)}
            />
            إجباري افتراضياً عند النسخ لطلب توظيف
          </label>

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
            <button
              type="button"
              disabled={saving || !newText.trim()}
              onClick={handleAdd}
              className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark transition disabled:opacity-60"
            >
              {saving ? "..." : "حفظ السؤال"}
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-sm text-gray-500">جاري التحميل...</p>
      ) : filteredQuestions.length === 0 ? (
        <p className="text-sm text-gray-500">لا توجد أسئلة.</p>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={filteredQuestions.map((q) => q.id)}
            strategy={verticalListSortingStrategy}
          >
            <ul>
              {filteredQuestions.map((q) => (
                <SortableConfigRow key={q.id} id={q.id}>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`text-sm ${
                          q.is_active ? "text-gray-900" : "text-gray-400 line-through"
                        }`}
                      >
                        {q.question_text}
                      </span>
                      <span className="text-xs text-gray-400">
                        ({questionTypeLabel(q.question_type)})
                      </span>
                      <span className="text-xs text-gray-400">
                        {q.department ?? "عام"}
                      </span>
                    </div>
                    {CHOICE_QUESTION_TYPES.includes(
                      q.question_type as QuestionType,
                    ) && (
                      <QuestionOptionsEditor
                        options={q.question_bank_options}
                        onAdd={(text) => addOption(q.id, text)}
                        onUpdate={(id, text) => editOption(id, text)}
                        onDelete={(id) => removeOption(id)}
                      />
                    )}
                  </div>
                  <button
                    type="button"
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={() => toggleActive(q.id, !q.is_active)}
                    className="text-gray-500 hover:text-gray-700 flex-shrink-0"
                    title={q.is_active ? "تعطيل" : "تفعيل"}
                  >
                    {q.is_active ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </SortableConfigRow>
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
};

export default QuestionBankEditor;
