import React, { useState } from "react";
import { ChevronDown, ChevronLeft, Pencil, Plus, Trash } from "lucide-react";
import Button from "../../ui/Button";
import SortableList from "./SortableList";
import { WorkFull, ItemRow } from "../../../hooks/operations/boq/types";
import { Zone } from "../../../hooks/operations/boq/useZones";
import { formatCurrency } from "../../../utils/helpper";

export type ItemEditUpdate = {
  id: string;
  quantity?: number;
  unit_price?: number | null;
};

type BOQTreeProps = {
  zones: Zone[];
  works: WorkFull[];
  onAddWork: (zone: Zone) => void;
  onEditWork: (work: WorkFull) => void;
  onDeleteWork: (work: WorkFull) => void;
  onReorderWorks: (zone: Zone, reordered: WorkFull[]) => void;
  onAddItem: (work: WorkFull) => void;
  onEditItem: (work: WorkFull, item: ItemRow) => void;
  onDeleteItem: (work: WorkFull, item: ItemRow) => void;
  onReorderItems: (work: WorkFull, reordered: ItemRow[]) => void;
  onSaveQuantities: (work: WorkFull, updates: ItemEditUpdate[]) => void;
  savingQuantities?: boolean;
};

function useExpanded() {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const toggle = (key: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };
  return { expanded, toggle };
}

const BOQTree: React.FC<BOQTreeProps> = ({
  zones,
  works,
  onAddWork,
  onEditWork,
  onDeleteWork,
  onReorderWorks,
  onAddItem,
  onEditItem,
  onDeleteItem,
  onReorderItems,
  onSaveQuantities,
  savingQuantities,
}) => {
  const { expanded, toggle } = useExpanded();

  if (zones.length === 0) {
    return (
      <div className="border border-dashed rounded-xl py-12 text-center text-sm text-gray-400">
        لا توجد مناطق بعد
      </div>
    );
  }

  return (
    <div className="border rounded-xl shadow-sm overflow-hidden divide-y">
      {zones.map((zone) => (
        <ZoneRow
          key={zone.id}
          zone={zone}
          works={works.filter((w) => w.zone_id === zone.id)}
          expanded={expanded}
          toggle={toggle}
          onAddWork={onAddWork}
          onEditWork={onEditWork}
          onDeleteWork={onDeleteWork}
          onReorderWorks={onReorderWorks}
          onAddItem={onAddItem}
          onEditItem={onEditItem}
          onDeleteItem={onDeleteItem}
          onReorderItems={onReorderItems}
          onSaveQuantities={onSaveQuantities}
          savingQuantities={savingQuantities}
        />
      ))}
    </div>
  );
};

type ZoneRowProps = {
  zone: Zone;
  works: WorkFull[];
  expanded: Set<string>;
  toggle: (key: string) => void;
  onAddWork: (zone: Zone) => void;
  onEditWork: (work: WorkFull) => void;
  onDeleteWork: (work: WorkFull) => void;
  onReorderWorks: (zone: Zone, reordered: WorkFull[]) => void;
  onAddItem: (work: WorkFull) => void;
  onEditItem: (work: WorkFull, item: ItemRow) => void;
  onDeleteItem: (work: WorkFull, item: ItemRow) => void;
  onReorderItems: (work: WorkFull, reordered: ItemRow[]) => void;
  onSaveQuantities: (work: WorkFull, updates: ItemEditUpdate[]) => void;
  savingQuantities?: boolean;
};

const ZoneRow: React.FC<ZoneRowProps> = ({
  zone,
  works,
  expanded,
  toggle,
  onAddWork,
  onEditWork,
  onDeleteWork,
  onReorderWorks,
  onAddItem,
  onEditItem,
  onDeleteItem,
  onReorderItems,
  onSaveQuantities,
  savingQuantities,
}) => {
  const key = `zone:${zone.id}`;
  const isOpen = expanded.has(key);

  return (
    <div className="bg-white">
      <div className="flex items-start justify-between gap-3 px-5 py-4 hover:bg-gray-50/70 transition-colors">
        <button
          type="button"
          className="flex items-start gap-2.5 text-[15px] font-semibold text-gray-900 min-w-0 text-right"
          onClick={() => toggle(key)}
        >
          {isOpen ? (
            <ChevronDown className="w-4 h-4 shrink-0 text-gray-400 mt-0.5" />
          ) : (
            <ChevronLeft className="w-4 h-4 shrink-0 text-gray-400 mt-0.5" />
          )}
          <span className="break-words">{zone.name}</span>
          <span className="text-xs text-gray-400 font-normal shrink-0 mt-0.5">
            {works.length} عمل
          </span>
        </button>
        <div className="flex items-center gap-1 shrink-0">
          <Button
            size="xs"
            variant="ghost"
            className="gap-1"
            onClick={() => onAddWork(zone)}
          >
            <Plus className="w-3.5 h-3.5" />
            عمل جديد
          </Button>
        </div>
      </div>

      {isOpen && (
        <div className="pb-4 pr-9 pl-5">
          <div className="border-r-2 border-gray-100 pr-4">
            <SortableList
              items={works}
              onReorder={(reordered) => onReorderWorks(zone, reordered)}
              emptyMessage="لا توجد أعمال بعد"
              renderItem={(work) => (
                <WorkRow
                  work={work}
                  expanded={expanded}
                  toggle={toggle}
                  onEditWork={onEditWork}
                  onDeleteWork={onDeleteWork}
                  onAddItem={onAddItem}
                  onEditItem={onEditItem}
                  onDeleteItem={onDeleteItem}
                  onReorderItems={onReorderItems}
                  onSaveQuantities={onSaveQuantities}
                  savingQuantities={savingQuantities}
                />
              )}
            />
          </div>
        </div>
      )}
    </div>
  );
};

type WorkRowProps = {
  work: WorkFull;
  expanded: Set<string>;
  toggle: (key: string) => void;
  onEditWork: (work: WorkFull) => void;
  onDeleteWork: (work: WorkFull) => void;
  onAddItem: (work: WorkFull) => void;
  onEditItem: (work: WorkFull, item: ItemRow) => void;
  onDeleteItem: (work: WorkFull, item: ItemRow) => void;
  onReorderItems: (work: WorkFull, reordered: ItemRow[]) => void;
  onSaveQuantities: (work: WorkFull, updates: ItemEditUpdate[]) => void;
  savingQuantities?: boolean;
};

const WorkRow: React.FC<WorkRowProps> = ({
  work,
  expanded,
  toggle,
  onEditWork,
  onDeleteWork,
  onAddItem,
  onEditItem,
  onDeleteItem,
  onReorderItems,
  onSaveQuantities,
  savingQuantities,
}) => {
  const key = `work:${work.id}`;
  const isOpen = expanded.has(key);
  const [quantityDrafts, setQuantityDrafts] = useState<Record<string, string>>(
    {},
  );
  const [priceDrafts, setPriceDrafts] = useState<Record<string, string>>({});

  const handleQuantityDraftChange = (itemId: string, value: string) => {
    setQuantityDrafts((prev) => ({ ...prev, [itemId]: value }));
  };

  const handlePriceDraftChange = (itemId: string, value: string) => {
    setPriceDrafts((prev) => ({ ...prev, [itemId]: value }));
  };

  const pendingUpdates = work.items
    .map((item): ItemEditUpdate | null => {
      const quantityDraft = quantityDrafts[item.id];
      const priceDraft = priceDrafts[item.id];

      let quantity: number | undefined;
      if (quantityDraft !== undefined && quantityDraft !== "") {
        const parsed = Number(quantityDraft);
        if (!Number.isNaN(parsed) && parsed !== item.quantity) {
          quantity = parsed;
        }
      }

      let unit_price: number | undefined;
      if (priceDraft !== undefined && priceDraft !== "") {
        const parsed = Number(priceDraft);
        if (!Number.isNaN(parsed) && parsed !== item.unit_price) {
          unit_price = parsed;
        }
      }

      if (quantity === undefined && unit_price === undefined) return null;
      return { id: item.id, quantity, unit_price };
    })
    .filter((u): u is ItemEditUpdate => u !== null);

  const handleSaveQuantities = () => {
    if (pendingUpdates.length === 0) return;
    onSaveQuantities(work, pendingUpdates);
    setQuantityDrafts({});
    setPriceDrafts({});
  };

  return (
    <div className="border rounded-lg bg-gray-50/40 hover:bg-gray-50 transition-colors overflow-hidden">
      <div className="flex items-start justify-between gap-3 px-4 py-3">
        <button
          type="button"
          className="flex items-start gap-2.5 text-sm font-medium text-gray-800 min-w-0 text-right"
          onClick={() => toggle(key)}
        >
          {isOpen ? (
            <ChevronDown className="w-3.5 h-3.5 shrink-0 text-gray-400 mt-0.5" />
          ) : (
            <ChevronLeft className="w-3.5 h-3.5 shrink-0 text-gray-400 mt-0.5" />
          )}
          <span className="break-words">{work.name}</span>
          <span className="text-xs text-gray-400 font-normal shrink-0 mt-0.5">
            {work.items.length} بند
          </span>
        </button>
        <div className="flex items-center gap-1 shrink-0">
          {pendingUpdates.length > 0 && (
            <Button
              size="xs"
              onClick={handleSaveQuantities}
              loading={savingQuantities}
            >
              حفظ التعديلات ({pendingUpdates.length})
            </Button>
          )}
          <Button
            size="xs"
            variant="ghost"
            className="gap-1"
            onClick={() => onAddItem(work)}
          >
            <Plus className="w-3.5 h-3.5" />
            بند جديد
          </Button>
          <button
            type="button"
            className="p-1.5 rounded text-gray-400 hover:text-primary hover:bg-white"
            aria-label="تعديل العمل"
            onClick={() => onEditWork(work)}
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            className="p-1.5 rounded text-gray-400 hover:text-error hover:bg-white"
            aria-label="حذف العمل"
            onClick={() => onDeleteWork(work)}
          >
            <Trash className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="px-4 pb-4">
          <SortableList
            items={work.items}
            onReorder={(reordered) => onReorderItems(work, reordered)}
            emptyMessage="لا توجد بنود بعد"
            renderItem={(item) => {
              const quantityDraft = quantityDrafts[item.id];
              const parsedQuantity =
                quantityDraft === undefined || quantityDraft === ""
                  ? NaN
                  : Number(quantityDraft);
              const effectiveQuantity = Number.isNaN(parsedQuantity)
                ? item.quantity
                : parsedQuantity;

              const priceDraft = priceDrafts[item.id];
              const parsedPrice =
                priceDraft === undefined || priceDraft === ""
                  ? NaN
                  : Number(priceDraft);
              const effectivePrice = Number.isNaN(parsedPrice)
                ? item.unit_price
                : parsedPrice;

              return (
                <div className="flex items-center gap-3 text-sm bg-white border rounded-md px-3.5 py-3 hover:border-gray-300 transition-colors">
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-gray-900 break-words">
                      {item.name}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-gray-400 text-xs mt-1">
                      <span>{item.unit}</span>
                      {effectivePrice !== null && (
                        <span>
                          الاجمالي:{" "}
                          {formatCurrency(effectivePrice * effectiveQuantity)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="flex flex-col items-start gap-0.5">
                      <span className="text-[10px] text-gray-400 leading-none">
                        الكمية
                      </span>
                      <input
                        aria-label="الكمية"
                        type="number"
                        className="w-20 shrink-0 text-xs border rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary"
                        value={quantityDrafts[item.id] ?? item.quantity}
                        onChange={(e) =>
                          handleQuantityDraftChange(item.id, e.target.value)
                        }
                      />
                    </div>
                    <div className="flex flex-col items-start gap-0.5">
                      <span className="text-[10px] text-gray-400 leading-none">
                        السعر
                      </span>
                      <input
                        aria-label="السعر"
                        type="number"
                        className="w-24 shrink-0 text-xs border rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary"
                        value={priceDrafts[item.id] ?? item.unit_price ?? ""}
                        onChange={(e) =>
                          handlePriceDraftChange(item.id, e.target.value)
                        }
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      className="p-1 rounded text-gray-400 hover:text-primary hover:bg-gray-100"
                      aria-label="تعديل البند"
                      onClick={() => onEditItem(work, item)}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      className="p-1 rounded text-gray-400 hover:text-error hover:bg-gray-100"
                      aria-label="حذف البند"
                      onClick={() => onDeleteItem(work, item)}
                    >
                      <Trash className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            }}
          />
          {pendingUpdates.length > 0 && (
            <div className="flex justify-end mt-3">
              <Button
                size="sm"
                onClick={handleSaveQuantities}
                loading={savingQuantities}
              >
                حفظ التعديلات ({pendingUpdates.length})
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BOQTree;
