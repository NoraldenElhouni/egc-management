import { useEffect, useMemo, useState } from "react";
import { X, Plus, Search, ChevronDown, ChevronLeft } from "lucide-react";
import { useTypes } from "../../../../hooks/operations/boq/useTypes";
import { useZones } from "../../../../hooks/operations/boq/useZones";
import { useTypeWorks } from "../../../../hooks/operations/boq/useWorks";
import { WorkFull } from "../../../../hooks/operations/boq/types";
import { RoundItemForm } from "../../../../types/schema/contracts.schema";

interface BOQItemPickerDialogProps {
  projectId: string;
  /** boq_item_id values already present in the round being built/edited */
  alreadySelectedBoqItemIds: string[];
  onConfirm: (items: RoundItemForm[]) => void;
  onClose: () => void;
}

type CustomLineDraft = {
  tempId: string;
  work_id: string;
  name: string;
  unit: string;
  quantity: string;
};

const BOQItemPickerDialog = ({
  projectId,
  alreadySelectedBoqItemIds,
  onConfirm,
  onClose,
}: BOQItemPickerDialogProps) => {
  const { types, loading: typesLoading } = useTypes(projectId);
  const { zones } = useZones(projectId);
  const [selectedTypeId, setSelectedTypeId] = useState("");
  const { works, loading: worksLoading } = useTypeWorks(selectedTypeId);

  useEffect(() => {
    if (!selectedTypeId && types.length > 0) {
      setSelectedTypeId(types[0].id);
    }
  }, [types, selectedTypeId]);

  const [search, setSearch] = useState("");
  const [expandedWorks, setExpandedWorks] = useState<Set<string>>(new Set());
  const [pickedItemIds, setPickedItemIds] = useState<Set<string>>(new Set());
  const [customLines, setCustomLines] = useState<CustomLineDraft[]>([]);
  const [addingCustomFor, setAddingCustomFor] = useState<string | null>(null);
  const [customDraft, setCustomDraft] = useState({
    name: "",
    unit: "",
    quantity: "1",
  });

  const toggleWork = (workId: string) => {
    setExpandedWorks((prev) => {
      const next = new Set(prev);
      if (next.has(workId)) next.delete(workId);
      else next.add(workId);
      return next;
    });
  };

  const toggleItem = (itemId: string) => {
    setPickedItemIds((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) next.delete(itemId);
      else next.add(itemId);
      return next;
    });
  };

  const selectableWorkItemIds = (work: WorkFull) =>
    work.items
      .filter((i) => !alreadySelectedBoqItemIds.includes(i.id))
      .map((i) => i.id);

  const isWorkFullySelected = (work: WorkFull) => {
    const ids = selectableWorkItemIds(work);
    return ids.length > 0 && ids.every((id) => pickedItemIds.has(id));
  };

  const toggleWorkSelection = (
    work: WorkFull,
    e: React.MouseEvent | React.ChangeEvent,
  ) => {
    e.stopPropagation();
    const ids = selectableWorkItemIds(work);
    if (ids.length === 0) return;
    const selectAll = !isWorkFullySelected(work);
    setPickedItemIds((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => {
        if (selectAll) next.add(id);
        else next.delete(id);
      });
      return next;
    });
  };

  const filteredWorks: WorkFull[] = useMemo(() => {
    if (!search) return works;
    const q = search.toLowerCase();
    return works
      .map((w) => ({
        ...w,
        items: w.items.filter((i) => i.name.toLowerCase().includes(q)),
      }))
      .filter((w) => w.name.toLowerCase().includes(q) || w.items.length > 0);
  }, [works, search]);

  const worksByZone = useMemo(() => {
    const map: Record<string, WorkFull[]> = {};
    filteredWorks.forEach((w) => {
      if (!map[w.zone_id]) map[w.zone_id] = [];
      map[w.zone_id].push(w);
    });
    return map;
  }, [filteredWorks]);

  const startCustomLine = (workId: string) => {
    setAddingCustomFor(workId);
    setCustomDraft({ name: "", unit: "", quantity: "1" });
  };

  const confirmCustomLine = (workId: string) => {
    if (!customDraft.name.trim() || !customDraft.unit.trim()) return;
    setCustomLines((prev) => [
      ...prev,
      {
        tempId: crypto.randomUUID(),
        work_id: workId,
        name: customDraft.name,
        unit: customDraft.unit,
        quantity: customDraft.quantity,
      },
    ]);
    setAddingCustomFor(null);
  };

  const removeCustomLine = (tempId: string) => {
    setCustomLines((prev) => prev.filter((l) => l.tempId !== tempId));
  };

  const totalPicked = pickedItemIds.size + customLines.length;

  const handleConfirm = () => {
    const pickedItems: RoundItemForm[] = [];
    works.forEach((w) => {
      w.items.forEach((i) => {
        if (pickedItemIds.has(i.id)) {
          pickedItems.push({
            work_id: w.id,
            boq_item_id: i.id,
            name: i.name,
            unit: i.unit,
            quantity: i.quantity,
          });
        }
      });
    });
    const customItems: RoundItemForm[] = customLines.map((l) => ({
      work_id: l.work_id,
      boq_item_id: null,
      name: l.name,
      unit: l.unit,
      quantity: Number(l.quantity) || 0,
    }));
    onConfirm([...pickedItems, ...customItems]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4 flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="font-semibold text-lg">اختر بنود من قائمة الكميات</h2>
          <button onClick={onClose} type="button">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* type tabs */}
        <div className="p-3 border-b flex items-center gap-2 overflow-x-auto">
          {typesLoading ? (
            <span className="text-sm text-gray-400">
              جاري تحميل الأنواع...
            </span>
          ) : types.length === 0 ? (
            <span className="text-sm text-gray-400">
              لا توجد أنواع في هذا المشروع
            </span>
          ) : (
            types.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setSelectedTypeId(t.id)}
                className={`px-3 py-1.5 rounded-lg text-sm whitespace-nowrap border transition-colors ${
                  selectedTypeId === t.id
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
                }`}
              >
                {t.name}
                {t.version > 1 ? ` (v${t.version})` : ""}
              </button>
            ))
          )}
        </div>

        {/* search */}
        <div className="p-3 border-b">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="ابحث عن بند..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border rounded px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        {/* body */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          {worksLoading ? (
            <p className="text-center text-sm text-gray-400 py-8">
              جاري التحميل...
            </p>
          ) : !selectedTypeId ? (
            <p className="text-center text-sm text-gray-400 py-8">
              اختر نوعاً أولاً
            </p>
          ) : Object.keys(worksByZone).length === 0 ? (
            <p className="text-center text-sm text-gray-400 py-8">
              لا توجد أعمال
            </p>
          ) : (
            zones
              .filter((z) => worksByZone[z.id]?.length)
              .map((zone) => (
                <div key={zone.id}>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-1 mb-2">
                    {zone.name}
                  </p>
                  <div className="space-y-2">
                    {worksByZone[zone.id].map((work) => {
                      const isOpen = expandedWorks.has(work.id) || !!search;
                      const pickedCount =
                        work.items.filter((i) => pickedItemIds.has(i.id))
                          .length +
                        customLines.filter((l) => l.work_id === work.id)
                          .length;
                      return (
                        <div
                          key={work.id}
                          className="border rounded-lg overflow-hidden"
                        >
                          <div className="w-full flex items-center justify-between px-3 py-2 bg-gray-50 hover:bg-gray-100">
                            <button
                              type="button"
                              onClick={() => toggleWork(work.id)}
                              className="flex-1 flex items-center gap-2 text-sm font-medium text-right"
                            >
                              {isOpen ? (
                                <ChevronDown className="w-4 h-4 text-gray-400" />
                              ) : (
                                <ChevronLeft className="w-4 h-4 text-gray-400" />
                              )}
                              {work.name}
                              {pickedCount > 0 && (
                                <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">
                                  {pickedCount}
                                </span>
                              )}
                            </button>
                            <span className="text-xs text-gray-400 ml-2">
                              {work.items.length} بند
                            </span>
                            <label
                              title="اختيار كل بنود هذا العمل"
                              onClick={(e) => e.stopPropagation()}
                              className="flex items-center gap-1.5 mr-3 pr-3 border-r cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={isWorkFullySelected(work)}
                                disabled={selectableWorkItemIds(work).length === 0}
                                onChange={(e) => toggleWorkSelection(work, e)}
                                className="w-4 h-4 accent-blue-600"
                              />
                              <span className="text-xs text-gray-500 whitespace-nowrap">
                                اختيار الكل
                              </span>
                            </label>
                          </div>
                          {isOpen && (
                            <div className="p-2 space-y-1">
                              {work.items.length === 0 && (
                                <p className="text-xs text-gray-400 px-2 py-2">
                                  لا توجد بنود في هذا العمل
                                </p>
                              )}
                              {work.items.map((item) => {
                                const isAlreadyIn =
                                  alreadySelectedBoqItemIds.includes(item.id);
                                const isChecked =
                                  pickedItemIds.has(item.id) || isAlreadyIn;
                                return (
                                  <label
                                    key={item.id}
                                    className={`flex items-center gap-3 px-2 py-1.5 rounded text-right ${
                                      isAlreadyIn
                                        ? "opacity-50 cursor-not-allowed"
                                        : "hover:bg-gray-50 cursor-pointer"
                                    }`}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      disabled={isAlreadyIn}
                                      onChange={() => toggleItem(item.id)}
                                      className="w-4 h-4 accent-blue-600"
                                    />
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm truncate">
                                        {item.name}
                                      </p>
                                      <p className="text-xs text-gray-400">
                                        {item.unit} · الكمية: {item.quantity}
                                      </p>
                                    </div>
                                    {isAlreadyIn && (
                                      <span className="text-xs text-gray-400 shrink-0">
                                        مضاف مسبقاً
                                      </span>
                                    )}
                                  </label>
                                );
                              })}

                              {/* custom lines already staged for this work */}
                              {customLines
                                .filter((l) => l.work_id === work.id)
                                .map((line) => (
                                  <div
                                    key={line.tempId}
                                    className="flex items-center gap-3 px-2 py-1.5 rounded bg-amber-50 border border-amber-200"
                                  >
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm truncate">
                                        {line.name}{" "}
                                        <span className="text-xs text-amber-600">
                                          (بند مخصص)
                                        </span>
                                      </p>
                                      <p className="text-xs text-gray-400">
                                        {line.unit} · الكمية: {line.quantity}
                                      </p>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        removeCustomLine(line.tempId)
                                      }
                                      className="text-red-400 hover:text-red-600"
                                    >
                                      <X className="w-4 h-4" />
                                    </button>
                                  </div>
                                ))}

                              {/* add custom line */}
                              {addingCustomFor === work.id ? (
                                <div className="p-2 border rounded-lg bg-gray-50 space-y-2">
                                  <div className="grid grid-cols-3 gap-2">
                                    <input
                                      type="text"
                                      placeholder="اسم البند"
                                      value={customDraft.name}
                                      onChange={(e) =>
                                        setCustomDraft((d) => ({
                                          ...d,
                                          name: e.target.value,
                                        }))
                                      }
                                      className="border rounded px-2 py-1 text-sm"
                                    />
                                    <input
                                      type="text"
                                      placeholder="الوحدة"
                                      value={customDraft.unit}
                                      onChange={(e) =>
                                        setCustomDraft((d) => ({
                                          ...d,
                                          unit: e.target.value,
                                        }))
                                      }
                                      className="border rounded px-2 py-1 text-sm"
                                    />
                                    <input
                                      type="number"
                                      placeholder="الكمية"
                                      value={customDraft.quantity}
                                      onChange={(e) =>
                                        setCustomDraft((d) => ({
                                          ...d,
                                          quantity: e.target.value,
                                        }))
                                      }
                                      className="border rounded px-2 py-1 text-sm"
                                    />
                                  </div>
                                  <div className="flex justify-end gap-2">
                                    <button
                                      type="button"
                                      onClick={() => setAddingCustomFor(null)}
                                      className="text-xs text-gray-500 px-2 py-1"
                                    >
                                      إلغاء
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        confirmCustomLine(work.id)
                                      }
                                      className="text-xs bg-blue-600 text-white rounded px-3 py-1"
                                    >
                                      إضافة
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => startCustomLine(work.id)}
                                  className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 px-2 py-1"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                  إضافة بند مخصص تحت هذا العمل
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
          )}
        </div>

        <div className="p-4 border-t flex items-center justify-between gap-3">
          <span className="text-sm text-gray-500">
            {totalPicked > 0
              ? `تم اختيار ${totalPicked} بند`
              : "لم يتم الاختيار"}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border text-sm hover:bg-gray-50"
            >
              إلغاء
            </button>
            <button
              type="button"
              disabled={totalPicked === 0}
              onClick={handleConfirm}
              className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700 disabled:opacity-50"
            >
              إضافة
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BOQItemPickerDialog;
