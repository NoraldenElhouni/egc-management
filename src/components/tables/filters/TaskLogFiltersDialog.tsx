import { useState } from "react";
import Dialog from "../../ui/Dialog";
import Button from "../../ui/Button";
import { FilterDate, FilterSelect, FiltersButton, type FilterOption } from "./FilterControls";
import { TASK_LOG_ACTIONS } from "../../../config/logs";

export interface TaskLogFilterState {
  spaceId: string;
  projectId: string;
  actorId: string;
  action: string;
  /** yyyy-mm-dd from <input type="date"> */
  fromDate: string;
  toDate: string;
}

export const EMPTY_TASK_LOG_FILTERS: TaskLogFilterState = {
  spaceId: "",
  projectId: "",
  actorId: "",
  action: "",
  fromDate: "",
  toDate: "",
};

const ACTION_OPTIONS: FilterOption[] = TASK_LOG_ACTIONS.map((a) => ({ value: a.action, label: a.label }));

interface TaskLogFiltersDialogProps {
  value: TaskLogFilterState;
  onChange: (next: TaskLogFilterState) => void;
  spaceOptions: FilterOption[];
  projectOptions: FilterOption[];
  userOptions: FilterOption[];
  optionsLoading?: boolean;
}

/**
 * Filters button + dialog for the task log (سجل المهام). Same layout as
 * ActivityLogFiltersDialog; the filters are applied by the database
 * (get_task_activity).
 */
export default function TaskLogFiltersDialog({
  value,
  onChange,
  spaceOptions,
  projectOptions,
  userOptions,
  optionsLoading,
}: TaskLogFiltersDialogProps) {
  const [open, setOpen] = useState(false);

  const activeCount =
    (value.spaceId ? 1 : 0) +
    (value.projectId ? 1 : 0) +
    (value.actorId ? 1 : 0) +
    (value.action ? 1 : 0) +
    (value.fromDate || value.toDate ? 1 : 0);

  const set = <K extends keyof TaskLogFilterState>(key: K, v: TaskLogFilterState[K]) =>
    onChange({ ...value, [key]: v });

  return (
    <>
      <FiltersButton activeCount={activeCount} onClick={() => setOpen(true)} />

      <Dialog isOpen={open} onClose={() => setOpen(false)}>
        <div dir="rtl" className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">الفلاتر</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FilterSelect
              id="task-log-space"
              label="المساحة"
              options={spaceOptions}
              selected={value.spaceId}
              onSelect={(v) => set("spaceId", v)}
              loading={optionsLoading}
            />
            <FilterSelect
              id="task-log-project"
              label="المشروع"
              options={projectOptions}
              selected={value.projectId}
              onSelect={(v) => set("projectId", v)}
              loading={optionsLoading}
            />
            <FilterSelect
              id="task-log-user"
              label="المستخدم"
              options={userOptions}
              selected={value.actorId}
              onSelect={(v) => set("actorId", v)}
              loading={optionsLoading}
            />
            <FilterSelect
              id="task-log-action"
              label="نوع الحدث"
              options={ACTION_OPTIONS}
              selected={value.action}
              onSelect={(v) => set("action", v)}
            />
            <FilterDate id="task-log-from" label="التاريخ من" value={value.fromDate} onChange={(v) => set("fromDate", v)} />
            <FilterDate id="task-log-to" label="التاريخ إلى" value={value.toDate} onChange={(v) => set("toDate", v)} />
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() => onChange(EMPTY_TASK_LOG_FILTERS)}
              disabled={activeCount === 0}
              className="text-sm font-medium text-red-600 hover:text-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              مسح الفلاتر
            </button>
            <Button type="button" variant="primary" size="sm" onClick={() => setOpen(false)}>
              تم
            </Button>
          </div>
        </div>
      </Dialog>
    </>
  );
}
