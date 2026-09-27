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

interface CriteriaListEditorProps {
  category: EvaluationCategory;
  title: string;
}

const CriteriaListEditor: React.FC<CriteriaListEditorProps> = ({
  category,
  title,
}) => {
  const {
    criteria,
    loading,
    createCriterion,
    editCriterion,
    toggleCriterionActive,
    reorderCriteriaList,
  } = useEvaluationConfig(category, false);

  const [newName, setNewName] = useState("");
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newName.trim();
    if (!trimmed) return;
    setAdding(true);
    try {
      await createCriterion(trimmed);
      setNewName("");
    } finally {
      setAdding(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingId || !editName.trim()) return;
    await editCriterion(editingId, editName);
    setEditingId(null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = criteria.findIndex((c) => c.id === active.id);
    const newIndex = criteria.findIndex((c) => c.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    reorderCriteriaList(arrayMove(criteria, oldIndex, newIndex));
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-900 mb-3">{title}</h3>

      <form onSubmit={handleAdd} className="flex gap-2 mb-3">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="إضافة بند تقييم جديد"
          className="flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
          disabled={adding}
        />
        <button
          type="submit"
          disabled={adding || !newName.trim()}
          className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-white hover:bg-primary-dark transition disabled:opacity-60"
        >
          <Plus className="w-4 h-4" /> إضافة
        </button>
      </form>

      {loading ? (
        <p className="text-sm text-gray-500">جاري التحميل...</p>
      ) : criteria.length === 0 ? (
        <p className="text-sm text-gray-500">لا توجد بنود تقييم بعد.</p>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={criteria.map((c) => c.id)}
            strategy={verticalListSortingStrategy}
          >
            <ul>
              {criteria.map((c) => (
                <SortableConfigRow key={c.id} id={c.id}>
                  {editingId === c.id ? (
                    <input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="flex-1 rounded-lg border border-gray-200 bg-white px-2 py-1 text-sm outline-none focus:border-gray-400"
                      autoFocus
                    />
                  ) : (
                    <span
                      className={`flex-1 text-sm truncate ${
                        c.is_active ? "text-gray-900" : "text-gray-400 line-through"
                      }`}
                    >
                      {c.name_ar}
                    </span>
                  )}

                  <div className="flex items-center gap-1 flex-shrink-0">
                    {editingId === c.id ? (
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
                            setEditingId(c.id);
                            setEditName(c.name_ar);
                          }}
                          className="text-gray-500 hover:text-gray-700"
                          title="تعديل"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onPointerDown={(e) => e.stopPropagation()}
                          onClick={() => toggleCriterionActive(c.id, !c.is_active)}
                          className="text-gray-500 hover:text-gray-700"
                          title={c.is_active ? "تعطيل" : "تفعيل"}
                        >
                          {c.is_active ? (
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

export default CriteriaListEditor;
