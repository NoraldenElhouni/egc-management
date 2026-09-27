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
import { Pencil, Check, X, Plus, EyeOff, Eye } from "lucide-react";
import SortableConfigRow from "./SortableConfigRow";
import { useEvaluationConfig } from "../../../hooks/hr/useEvaluationConfig";
import type { EvaluationCategory } from "../../../types/hr.type";

interface RatingScaleListEditorProps {
  category: EvaluationCategory;
  title: string;
}

const RatingScaleListEditor: React.FC<RatingScaleListEditorProps> = ({
  category,
  title,
}) => {
  const {
    ratingScale,
    loading,
    createRatingLevel,
    editRatingLevel,
    toggleRatingLevelActive,
    reorderRatingScaleList,
  } = useEvaluationConfig(category, false);

  const [newLabel, setNewLabel] = useState("");
  const [newScore, setNewScore] = useState("");
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [editScore, setEditScore] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newLabel.trim();
    const score = Number(newScore);
    if (!trimmed || Number.isNaN(score)) return;
    setAdding(true);
    try {
      await createRatingLevel(trimmed, score);
      setNewLabel("");
      setNewScore("");
    } finally {
      setAdding(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingId || !editLabel.trim()) return;
    const score = Number(editScore);
    if (Number.isNaN(score)) return;
    await editRatingLevel(editingId, editLabel, score);
    setEditingId(null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = ratingScale.findIndex((r) => r.id === active.id);
    const newIndex = ratingScale.findIndex((r) => r.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    reorderRatingScaleList(arrayMove(ratingScale, oldIndex, newIndex));
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-900 mb-3">{title}</h3>

      <form onSubmit={handleAdd} className="flex gap-2 mb-3">
        <input
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
          placeholder="التسمية (مثال: ممتاز)"
          className="flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
          disabled={adding}
        />
        <input
          value={newScore}
          onChange={(e) => setNewScore(e.target.value)}
          placeholder="الدرجة"
          type="number"
          className="w-20 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
          disabled={adding}
        />
        <button
          type="submit"
          disabled={adding || !newLabel.trim() || !newScore}
          className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-white hover:bg-primary-dark transition disabled:opacity-60"
        >
          <Plus className="w-4 h-4" /> إضافة
        </button>
      </form>

      {loading ? (
        <p className="text-sm text-gray-500">جاري التحميل...</p>
      ) : ratingScale.length === 0 ? (
        <p className="text-sm text-gray-500">لا يوجد سلم تقييم بعد.</p>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={ratingScale.map((r) => r.id)}
            strategy={verticalListSortingStrategy}
          >
            <ul>
              {ratingScale.map((r) => (
                <SortableConfigRow key={r.id} id={r.id}>
                  {editingId === r.id ? (
                    <>
                      <input
                        value={editLabel}
                        onChange={(e) => setEditLabel(e.target.value)}
                        className="flex-1 rounded-lg border border-gray-200 bg-white px-2 py-1 text-sm outline-none focus:border-gray-400"
                        autoFocus
                      />
                      <input
                        value={editScore}
                        onChange={(e) => setEditScore(e.target.value)}
                        type="number"
                        className="w-16 rounded-lg border border-gray-200 bg-white px-2 py-1 text-sm outline-none focus:border-gray-400"
                      />
                    </>
                  ) : (
                    <span
                      className={`flex-1 text-sm truncate ${
                        r.is_active ? "text-gray-900" : "text-gray-400 line-through"
                      }`}
                    >
                      {r.label_ar}{" "}
                      <span className="text-gray-400">({r.score})</span>
                    </span>
                  )}

                  <div className="flex items-center gap-1 flex-shrink-0">
                    {editingId === r.id ? (
                      <>
                        <button
                          type="button"
                          onPointerDown={(e) => e.stopPropagation()}
                          onClick={handleSaveEdit}
                          className="text-green-600 hover:text-green-700"
                          title="حفظ"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onPointerDown={(e) => e.stopPropagation()}
                          onClick={() => setEditingId(null)}
                          className="text-gray-500 hover:text-gray-700"
                          title="إلغاء"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onPointerDown={(e) => e.stopPropagation()}
                          onClick={() => {
                            setEditingId(r.id);
                            setEditLabel(r.label_ar);
                            setEditScore(String(r.score));
                          }}
                          className="text-gray-500 hover:text-gray-700"
                          title="تعديل"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onPointerDown={(e) => e.stopPropagation()}
                          onClick={() => toggleRatingLevelActive(r.id, !r.is_active)}
                          className="text-gray-500 hover:text-gray-700"
                          title={r.is_active ? "تعطيل" : "تفعيل"}
                        >
                          {r.is_active ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </>
                    )}
                  </div>
                </SortableConfigRow>
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
};

export default RatingScaleListEditor;
