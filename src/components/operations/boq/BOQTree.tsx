import React, { useState } from "react";
import { ChevronDown, ChevronLeft, Pencil, Plus, Trash } from "lucide-react";
import Button from "../../ui/Button";
import { WorkFull, ItemRow } from "../../../hooks/operations/boq/types";
import { Zone } from "../../../hooks/operations/boq/useZones";
import { formatCurrency } from "../../../utils/helpper";

type BOQTreeProps = {
  zones: Zone[];
  works: WorkFull[];
  onAddWork: (zone: Zone) => void;
  onEditWork: (work: WorkFull) => void;
  onDeleteWork: (work: WorkFull) => void;
  onAddItem: (work: WorkFull) => void;
  onEditItem: (work: WorkFull, item: ItemRow) => void;
  onDeleteItem: (work: WorkFull, item: ItemRow) => void;
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
  onAddItem,
  onEditItem,
  onDeleteItem,
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
          onAddItem={onAddItem}
          onEditItem={onEditItem}
          onDeleteItem={onDeleteItem}
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
  onAddItem: (work: WorkFull) => void;
  onEditItem: (work: WorkFull, item: ItemRow) => void;
  onDeleteItem: (work: WorkFull, item: ItemRow) => void;
};

const ZoneRow: React.FC<ZoneRowProps> = ({
  zone,
  works,
  expanded,
  toggle,
  onAddWork,
  onEditWork,
  onDeleteWork,
  onAddItem,
  onEditItem,
  onDeleteItem,
}) => {
  const key = `zone:${zone.id}`;
  const isOpen = expanded.has(key);

  return (
    <div className="bg-white">
      <div className="flex items-center justify-between gap-3 px-5 py-4 hover:bg-gray-50/70 transition-colors">
        <button
          type="button"
          className="flex items-center gap-2.5 text-[15px] font-semibold text-gray-900 min-w-0"
          onClick={() => toggle(key)}
        >
          {isOpen ? (
            <ChevronDown className="w-4 h-4 shrink-0 text-gray-400" />
          ) : (
            <ChevronLeft className="w-4 h-4 shrink-0 text-gray-400" />
          )}
          <span className="truncate">{zone.name}</span>
          <span className="text-xs text-gray-400 font-normal shrink-0">
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
          {works.length === 0 ? (
            <p className="text-sm text-gray-400 py-2">لا توجد أعمال بعد</p>
          ) : (
            <div className="flex flex-col gap-3 border-r-2 border-gray-100 pr-4">
              {works.map((work) => (
                <WorkRow
                  key={work.id}
                  work={work}
                  expanded={expanded}
                  toggle={toggle}
                  onEditWork={onEditWork}
                  onDeleteWork={onDeleteWork}
                  onAddItem={onAddItem}
                  onEditItem={onEditItem}
                  onDeleteItem={onDeleteItem}
                />
              ))}
            </div>
          )}
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
}) => {
  const key = `work:${work.id}`;
  const isOpen = expanded.has(key);

  return (
    <div className="border rounded-lg bg-gray-50/40 hover:bg-gray-50 transition-colors overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <button
          type="button"
          className="flex items-center gap-2.5 text-sm font-medium text-gray-800 min-w-0"
          onClick={() => toggle(key)}
        >
          {isOpen ? (
            <ChevronDown className="w-3.5 h-3.5 shrink-0 text-gray-400" />
          ) : (
            <ChevronLeft className="w-3.5 h-3.5 shrink-0 text-gray-400" />
          )}
          <span className="truncate">{work.name}</span>
          <span className="text-xs text-gray-400 font-normal shrink-0">
            {work.items.length} بند
          </span>
        </button>
        <div className="flex items-center gap-1 shrink-0">
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
        <div className="px-4 pb-4 flex flex-col gap-1.5">
          {work.items.length === 0 ? (
            <p className="text-sm text-gray-400">لا توجد بنود بعد</p>
          ) : (
            work.items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-3 text-sm bg-white border rounded-md px-3.5 py-2.5 hover:border-gray-300 transition-colors"
              >
                <div className="min-w-0 flex items-baseline gap-2">
                  <span className="font-medium text-gray-900 truncate">
                    {item.name}
                  </span>
                  <span className="text-gray-400 text-xs shrink-0">
                    {item.unit} {item.quantity}
                  </span>
                  {item.unit_price !== null && (
                    <span className="text-gray-400 text-xs shrink-0">
                      السعر: {formatCurrency(item.unit_price)}
                    </span>
                  )}
                  {item.unit_price !== null && (
                    <span className="text-gray-400 text-xs shrink-0">
                      الاجمالي: {formatCurrency(item.unit_price * item.quantity)}
                    </span>
                  )}
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
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default BOQTree;
