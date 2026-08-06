import React, { useState } from "react";
import { ChevronDown, ChevronLeft, Pencil, Plus, Trash } from "lucide-react";
import Button from "../../ui/Button";
import SortableList from "./SortableList";
import { TemplateItemRow, TemplateWorkFull } from "../../../hooks/operations/boq/types";
import { formatCurrency } from "../../../utils/helpper";

type TemplateTreeProps = {
  works: TemplateWorkFull[];
  onEditWork: (work: TemplateWorkFull) => void;
  onDeleteWork: (work: TemplateWorkFull) => void;
  onReorderWorks: (reordered: TemplateWorkFull[]) => void;
  onAddItem: (work: TemplateWorkFull) => void;
  onEditItem: (work: TemplateWorkFull, item: TemplateItemRow) => void;
  onDeleteItem: (work: TemplateWorkFull, item: TemplateItemRow) => void;
  onReorderItems: (work: TemplateWorkFull, reordered: TemplateItemRow[]) => void;
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

const TemplateTree: React.FC<TemplateTreeProps> = ({
  works,
  onEditWork,
  onDeleteWork,
  onReorderWorks,
  onAddItem,
  onEditItem,
  onDeleteItem,
  onReorderItems,
}) => {
  const { expanded, toggle } = useExpanded();

  return (
    <SortableList
      items={works}
      onReorder={onReorderWorks}
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
        />
      )}
    />
  );
};

type WorkRowProps = {
  work: TemplateWorkFull;
  expanded: Set<string>;
  toggle: (key: string) => void;
  onEditWork: (work: TemplateWorkFull) => void;
  onDeleteWork: (work: TemplateWorkFull) => void;
  onAddItem: (work: TemplateWorkFull) => void;
  onEditItem: (work: TemplateWorkFull, item: TemplateItemRow) => void;
  onDeleteItem: (work: TemplateWorkFull, item: TemplateItemRow) => void;
  onReorderItems: (work: TemplateWorkFull, reordered: TemplateItemRow[]) => void;
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
        <div className="px-4 pb-4">
          <SortableList
            items={work.items}
            onReorder={(reordered) => onReorderItems(work, reordered)}
            emptyMessage="لا توجد بنود بعد"
            renderItem={(item) => (
              <div className="flex items-center justify-between gap-3 text-sm bg-white border rounded-md px-3.5 py-2.5 hover:border-gray-300 transition-colors">
                <div className="min-w-0 flex items-baseline gap-2">
                  <span className="font-medium text-gray-900 truncate">
                    {item.name}
                  </span>
                  <span className="text-gray-400 text-xs shrink-0">
                    {item.unit} {item.default_quantity}
                  </span>
                  {item.default_unit_price !== null && (
                    <span className="text-gray-400 text-xs shrink-0">
                      السعر: {formatCurrency(item.default_unit_price)}
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
            )}
          />
        </div>
      )}
    </div>
  );
};

export default TemplateTree;
