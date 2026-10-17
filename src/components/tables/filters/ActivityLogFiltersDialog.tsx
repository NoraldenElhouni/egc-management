import { useState } from "react";
import Dialog from "../../ui/Dialog";
import Button from "../../ui/Button";
import { FilterDate, FilterSelect, FiltersButton, type FilterOption } from "./FilterControls";
import type { LogGroup } from "../../../types/logs.types";

export interface ActivityLogFilterState {
  group: LogGroup | "";
  logName: string;
  projectId: string;
  actorId: string;
  /** yyyy-mm-dd from <input type="date"> */
  fromDate: string;
  toDate: string;
}

export const EMPTY_ACTIVITY_FILTERS: ActivityLogFilterState = {
  group: "",
  logName: "",
  projectId: "",
  actorId: "",
  fromDate: "",
  toDate: "",
};

type Option = FilterOption;

interface ActivityLogFiltersDialogProps {
  value: ActivityLogFilterState;
  onChange: (next: ActivityLogFilterState) => void;
  groupOptions: Option[];
  /** Log options for the chosen group (or all the user may read). */
  logOptions: Option[];
  projectOptions: Option[];
  userOptions: Option[];
  optionsLoading?: boolean;
}

/**
 * Filters button + dialog for the activity log. Same layout as
 * ContractorPaymentsFiltersDialog (button at the end of the search row,
 * badge with the number of active filters, مسح الفلاتر / تم), but the
 * filters are applied by the database (get_activity), not by the table.
 */
export default function ActivityLogFiltersDialog({
  value,
  onChange,
  groupOptions,
  logOptions,
  projectOptions,
  userOptions,
  optionsLoading,
}: ActivityLogFiltersDialogProps) {
  const [open, setOpen] = useState(false);

  const activeCount =
    (value.group ? 1 : 0) +
    (value.logName ? 1 : 0) +
    (value.projectId ? 1 : 0) +
    (value.actorId ? 1 : 0) +
    (value.fromDate || value.toDate ? 1 : 0);

  const set = <K extends keyof ActivityLogFilterState>(key: K, v: ActivityLogFilterState[K]) =>
    onChange({ ...value, [key]: v });

  return (
    <>
      <FiltersButton activeCount={activeCount} onClick={() => setOpen(true)} />

      <Dialog isOpen={open} onClose={() => setOpen(false)}>
        <div dir="rtl" className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">الفلاتر</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FilterSelect
              id="activity-group"
              label="المجموعة"
              options={groupOptions}
              selected={value.group}
              // A log belongs to one group: changing the group clears the log.
              onSelect={(v) => onChange({ ...value, group: v as LogGroup | "", logName: "" })}
            />
            <FilterSelect
              id="activity-log"
              label="السجل"
              options={logOptions}
              selected={value.logName}
              onSelect={(v) => set("logName", v)}
            />
            <FilterSelect
              id="activity-project"
              label="المشروع"
              options={projectOptions}
              selected={value.projectId}
              onSelect={(v) => set("projectId", v)}
              loading={optionsLoading}
            />
            <FilterSelect
              id="activity-user"
              label="المستخدم"
              options={userOptions}
              selected={value.actorId}
              onSelect={(v) => set("actorId", v)}
              loading={optionsLoading}
            />

            <FilterDate id="activity-from" label="التاريخ من" value={value.fromDate} onChange={(v) => set("fromDate", v)} />
            <FilterDate id="activity-to" label="التاريخ إلى" value={value.toDate} onChange={(v) => set("toDate", v)} />
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() => onChange(EMPTY_ACTIVITY_FILTERS)}
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
