import { useState, type ReactNode } from "react";
import { X } from "lucide-react";
import type { Priority } from "../../../hooks/tasks/useTaskBoard";
import type { TaskDirectoryData } from "../../../hooks/tasks/useTaskDirectory";
import {
  ASSIGNEE_NONE_KEY,
  PROJECT_NONE_KEY,
  createDefaultFilters,
  DEFAULT_SORT,
  type DirectoryFilterState,
  type DirectorySortState,
  type GroupSortKey,
  type TaskSortKey,
} from "./directoryFilters";

// Centered dialog, same shell as ColumnEditorModal.tsx (fixed inset-0
// backdrop, header with an X, scrollable body) rather than the earlier
// anchored dropdown — wider (max-w-2xl, two-column body) so every filter
// dimension gets real room instead of a cramped 320px popover. Still
// "dynamic": every toggle updates the list behind it immediately, there's
// no Apply step — the dialog just stays open (or closes on the backdrop/X)
// so several filters can be set in one pass.

const PRIORITY_LABELS: Record<Priority | "none", string> = {
  urgent: "عاجل",
  high: "مرتفعة",
  normal: "عادية",
  low: "منخفضة",
  none: "بدون أولوية",
};

function toggleInSet<T>(set: Set<T>, value: T): Set<T> {
  const next = new Set(set);
  if (next.has(value)) next.delete(value);
  else next.add(value);
  return next;
}

function SectionTitle({ children }: { children: ReactNode }) {
  return <div className="mb-1.5 text-xs font-semibold text-gray-500">{children}</div>;
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mb-4">
      <SectionTitle>{title}</SectionTitle>
      {children}
    </div>
  );
}

function CheckboxRow({
  checked,
  onChange,
  label,
  color,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
  color?: string | null;
}) {
  return (
    <label className="flex items-center gap-2 rounded px-1 py-1 text-sm text-gray-700 hover:bg-gray-50">
      <input type="checkbox" checked={checked} onChange={onChange} className="h-3.5 w-3.5" />
      {color !== undefined && <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: color ?? "#9CA3AF" }} />}
      <span className="truncate">{label}</span>
    </label>
  );
}

// A long, flat checklist (every project, every employee) makes the
// dialog itself grow with the company instead of staying a fixed size —
// this keeps it short (own search box + capped/scrollable list) so
// picking 2 people out of 40 doesn't mean scrolling the whole dialog.
function SearchableCheckboxList<T>({
  items,
  getId,
  getLabel,
  getColor,
  selected,
  onToggle,
  placeholder,
  extra,
}: {
  items: T[];
  getId: (item: T) => string;
  getLabel: (item: T) => string;
  getColor?: (item: T) => string | null;
  selected: Set<string>;
  onToggle: (id: string) => void;
  placeholder: string;
  extra?: ReactNode;
}) {
  const [search, setSearch] = useState("");
  const term = search.trim().toLowerCase();
  const filtered = term ? items.filter((item) => getLabel(item).toLowerCase().includes(term)) : items;

  return (
    <div>
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder={placeholder}
        className="mb-1.5 w-full rounded-md border border-gray-200 px-2 py-1 text-sm outline-none"
      />
      <div className="max-h-36 space-y-0.5 overflow-y-auto pl-1">
        {filtered.length === 0 ? (
          <div className="px-1 py-1 text-xs text-gray-400">لا نتائج</div>
        ) : (
          filtered.map((item) => {
            const id = getId(item);
            return (
              <CheckboxRow
                key={id}
                checked={selected.has(id)}
                onChange={() => onToggle(id)}
                label={getLabel(item)}
                color={getColor ? getColor(item) : undefined}
              />
            );
          })
        )}
        {extra}
      </div>
    </div>
  );
}

interface Props {
  filters: DirectoryFilterState;
  onChangeFilters: (filters: DirectoryFilterState) => void;
  sort: DirectorySortState;
  onChangeSort: (sort: DirectorySortState) => void;
  data: TaskDirectoryData;
  onClose: () => void;
}

export default function DirectoryFilterSortPopover({ filters, onChangeFilters, sort, onChangeSort, data, onClose }: Props) {
  const assigneeIdsInUse = Array.from(new Set(Array.from(data.assigneesByTask.values()).flat()));
  const assigneeOptions = assigneeIdsInUse
    .map((id) => data.employeesById.get(id))
    .filter((e): e is NonNullable<typeof e> => !!e)
    .sort((a, b) => `${a.first_name}`.localeCompare(`${b.first_name}`, "ar"));

  const taskTypeOptions = Array.from(data.taskTypes.values());
  const tagOptions = Array.from(new Map(Array.from(data.tagsByTask.values()).flat().map((t) => [t.id, t])).values());
  const projectOptions = Array.from(data.projectNamesById.entries());

  const statusModeOptions: [DirectoryFilterState["statusMode"], string][] = [
    ["open", "المفتوحة فقط"],
    ["all", "الكل"],
    ["custom", "تحديد..."],
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" dir="rtl" onClick={onClose}>
      <div
        className="flex max-h-[85vh] w-full max-w-2xl flex-col rounded-xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3.5">
          <h2 className="text-base font-semibold text-gray-900">فلترة وترتيب</h2>
          <button onClick={onClose} className="rounded-full p-1 text-gray-400 hover:bg-gray-100">
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          <div className="grid grid-cols-1 gap-x-8 sm:grid-cols-2">
            <div>
              <Section title="الحالة">
                <div className="space-y-0.5">
                  {statusModeOptions.map(([mode, label]) => (
                    <label key={mode} className="flex items-center gap-2 px-1 py-0.5 text-sm text-gray-700">
                      <input
                        type="radio"
                        checked={filters.statusMode === mode}
                        onChange={() => onChangeFilters({ ...filters, statusMode: mode })}
                        className="h-3.5 w-3.5"
                      />
                      {label}
                    </label>
                  ))}
                  {filters.statusMode === "custom" && (
                    <div className="mr-5 space-y-0.5 border-r border-gray-100 pr-2">
                      {data.statuses.map((s) => (
                        <CheckboxRow
                          key={s.id}
                          checked={filters.customStatusIds.has(s.id)}
                          onChange={() =>
                            onChangeFilters({ ...filters, customStatusIds: toggleInSet(filters.customStatusIds, s.id) })
                          }
                          label={s.label_ar ?? s.label}
                          color={s.color}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </Section>

              <Section title="الأولوية">
                {(Object.keys(PRIORITY_LABELS) as (Priority | "none")[]).map((p) => (
                  <CheckboxRow
                    key={p}
                    checked={filters.priorities.has(p)}
                    onChange={() => onChangeFilters({ ...filters, priorities: toggleInSet(filters.priorities, p) })}
                    label={PRIORITY_LABELS[p]}
                  />
                ))}
              </Section>

              <Section title="أخرى">
                <CheckboxRow
                  checked={filters.overdueOnly}
                  onChange={() => onChangeFilters({ ...filters, overdueOnly: !filters.overdueOnly })}
                  label="متأخرة فقط"
                />
              </Section>

              {taskTypeOptions.length > 0 && (
                <Section title="نوع المهمة">
                  {taskTypeOptions.map((t) => (
                    <CheckboxRow
                      key={t.id}
                      checked={filters.taskTypeIds.has(t.id)}
                      onChange={() => onChangeFilters({ ...filters, taskTypeIds: toggleInSet(filters.taskTypeIds, t.id) })}
                      label={t.name_ar}
                      color={t.color}
                    />
                  ))}
                </Section>
              )}
            </div>

            <div>
              {projectOptions.length > 0 && (
                <Section title="المشروع">
                  <SearchableCheckboxList
                    items={projectOptions}
                    getId={([id]) => id}
                    getLabel={([, name]) => name}
                    selected={filters.projectIds}
                    onToggle={(id) => onChangeFilters({ ...filters, projectIds: toggleInSet(filters.projectIds, id) })}
                    placeholder="ابحث عن مشروع..."
                    extra={
                      <CheckboxRow
                        checked={filters.projectIds.has(PROJECT_NONE_KEY)}
                        onChange={() =>
                          onChangeFilters({ ...filters, projectIds: toggleInSet(filters.projectIds, PROJECT_NONE_KEY) })
                        }
                        label="بدون مشروع"
                      />
                    }
                  />
                </Section>
              )}

              {assigneeOptions.length > 0 && (
                <Section title="الموظف المسؤول">
                  <SearchableCheckboxList
                    items={assigneeOptions}
                    getId={(e) => e.id}
                    getLabel={(e) => `${e.first_name} ${e.last_name ?? ""}`.trim()}
                    selected={filters.assigneeIds}
                    onToggle={(id) => onChangeFilters({ ...filters, assigneeIds: toggleInSet(filters.assigneeIds, id) })}
                    placeholder="ابحث عن موظف..."
                    extra={
                      <CheckboxRow
                        checked={filters.assigneeIds.has(ASSIGNEE_NONE_KEY)}
                        onChange={() =>
                          onChangeFilters({ ...filters, assigneeIds: toggleInSet(filters.assigneeIds, ASSIGNEE_NONE_KEY) })
                        }
                        label="غير معين"
                      />
                    }
                  />
                </Section>
              )}

              {tagOptions.length > 0 && (
                <Section title="الوسوم">
                  {tagOptions.map((tag) => (
                    <CheckboxRow
                      key={tag.id}
                      checked={filters.tagIds.has(tag.id)}
                      onChange={() => onChangeFilters({ ...filters, tagIds: toggleInSet(filters.tagIds, tag.id) })}
                      label={tag.name}
                      color={tag.color}
                    />
                  ))}
                </Section>
              )}

              <Section title="خصائص أخرى">
                <div>
                  <CheckboxRow
                    checked={filters.hasAttachments}
                    onChange={() => onChangeFilters({ ...filters, hasAttachments: !filters.hasAttachments })}
                    label="مرفقات"
                  />
                  <CheckboxRow
                    checked={filters.hasComments}
                    onChange={() => onChangeFilters({ ...filters, hasComments: !filters.hasComments })}
                    label="تعليقات"
                  />
                  <CheckboxRow
                    checked={filters.hasDescription}
                    onChange={() => onChangeFilters({ ...filters, hasDescription: !filters.hasDescription })}
                    label="وصف"
                  />
                  <CheckboxRow
                    checked={filters.isBlocked}
                    onChange={() => onChangeFilters({ ...filters, isBlocked: !filters.isBlocked })}
                    label="محظورة"
                  />
                  <CheckboxRow
                    checked={filters.hasUnmetRequirement}
                    onChange={() => onChangeFilters({ ...filters, hasUnmetRequirement: !filters.hasUnmetRequirement })}
                    label="متطلبات غير مكتملة"
                  />
                </div>
              </Section>
            </div>
          </div>

          <div className="mt-1 border-t border-gray-100 pt-3">
            <SectionTitle>الترتيب</SectionTitle>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <select
                value={sort.groupSort}
                onChange={(e) => onChangeSort({ ...sort, groupSort: e.target.value as GroupSortKey })}
                className="w-full rounded-md border border-gray-200 bg-white px-2 py-1.5 text-sm text-gray-600 outline-none"
              >
                <option value="count">الأقسام: الأكثر مهاماً أولاً</option>
                <option value="name">الأقسام: أبجدياً</option>
              </select>
              <select
                value={sort.taskSort}
                onChange={(e) => onChangeSort({ ...sort, taskSort: e.target.value as TaskSortKey })}
                className="w-full rounded-md border border-gray-200 bg-white px-2 py-1.5 text-sm text-gray-600 outline-none"
              >
                <option value="due_date">المهام: الأقرب استحقاقاً أولاً</option>
                <option value="priority">المهام: الأولوية</option>
                <option value="title">المهام: العنوان (أ-ي)</option>
                <option value="status">المهام: الحالة</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-gray-100 px-5 py-3">
          <button
            onClick={() => {
              onChangeFilters(createDefaultFilters());
              onChangeSort(DEFAULT_SORT);
            }}
            className="rounded-md px-2 py-1.5 text-sm font-medium text-gray-500 hover:bg-gray-50"
          >
            مسح الكل
          </button>
          <button
            onClick={onClose}
            className="rounded-md bg-primary px-4 py-1.5 text-sm font-medium text-white hover:bg-primary/90"
          >
            تم
          </button>
        </div>
      </div>
    </div>
  );
}
