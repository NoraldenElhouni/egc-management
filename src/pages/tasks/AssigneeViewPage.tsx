import { useMemo, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { ChevronDown, ChevronLeft, Loader2, Search } from "lucide-react";
import { useTaskDirectory } from "../../hooks/tasks/useTaskDirectory";
import DirectoryTaskRow, { directoryRowGridStyle } from "../../components/tasks/board/DirectoryTaskRow";
import { colorFor, initials } from "../../components/tasks/board/employeeAvatar";
import type { EmployeeLite, TaskRow } from "../../hooks/tasks/useTaskBoard";

// Assignee view — company-wide, cross-space (build plan Part 7's
// D6/D7 pattern extended to full inline edit, see task-module-build-plan
// notes for why D6/D7 themselves stayed read-only). The employee is the
// organizing unit: one section per employee, every task they're on —
// including as a secondary assignee, so a task with 2+ assignees appears
// in every one of their sections rather than just the first (unlike
// board/TaskTable.tsx's own group-by-assignee, which only needs one
// bucket per task for a single flat table).

const UNASSIGNED_KEY = "__unassigned__";

interface AssigneeGroup {
  key: string;
  employee: EmployeeLite | null;
  tasks: TaskRow[];
}

export default function AssigneeViewPage() {
  const navigate = useNavigate();
  const { data, loading, error, includeClosed, setIncludeClosed, ...mutations } = useTaskDirectory();
  const [collapsedKeys, setCollapsedKeys] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const searching = search.trim().length > 0;

  const groups = useMemo<AssigneeGroup[]>(() => {
    if (!data) return [];
    const term = search.trim().toLowerCase();
    const byEmployee = new Map<string, TaskRow[]>();
    const unassigned: TaskRow[] = [];

    for (const task of data.tasks) {
      if (term && !task.title.toLowerCase().includes(term)) continue;
      const assigneeIds = data.assigneesByTask.get(task.id) ?? [];
      if (assigneeIds.length === 0) {
        unassigned.push(task);
        continue;
      }
      for (const userId of assigneeIds) {
        const list = byEmployee.get(userId) ?? [];
        list.push(task);
        byEmployee.set(userId, list);
      }
    }

    const employeeGroups: AssigneeGroup[] = Array.from(byEmployee.entries())
      .map(([userId, tasks]) => ({ key: userId, employee: data.employeesById.get(userId) ?? null, tasks }))
      .sort((a, b) => b.tasks.length - a.tasks.length);

    if (unassigned.length > 0) {
      employeeGroups.push({ key: UNASSIGNED_KEY, employee: null, tasks: unassigned });
    }
    return employeeGroups;
  }, [data, search]);

  const toggle = (key: string) => {
    setCollapsedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center text-gray-400">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-red-500">
        تعذّر تحميل المهام حسب الموظف
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col" dir="rtl">
      <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-6 py-4">
        <h1 className="shrink-0 text-base font-semibold text-gray-900">المهام حسب الموظف</h1>
        <div className="flex items-center gap-3">
          <div className="flex w-56 items-center gap-2 rounded-lg bg-slate-50 px-2 py-1.5">
            <Search className="h-3.5 w-3.5 shrink-0 text-gray-400" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ابحث عن مهمة..."
              className="w-full bg-transparent text-sm outline-none"
              aria-label="بحث عن مهمة"
            />
          </div>
          <label className="flex shrink-0 items-center gap-1.5 text-xs text-gray-500">
            <input
              type="checkbox"
              checked={includeClosed}
              onChange={(e) => setIncludeClosed(e.target.checked)}
              className="h-3.5 w-3.5"
            />
            إظهار المكتملة
          </label>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {groups.length === 0 ? (
          <div className="p-6 text-center text-sm text-gray-400">
            {searching ? "لا توجد مهام مطابقة" : "لا توجد مهام"}
          </div>
        ) : (
          groups.map((group) => {
            const collapsed = !searching && collapsedKeys.has(group.key);
            const name = group.employee
              ? `${group.employee.first_name} ${group.employee.last_name ?? ""}`.trim()
              : "غير معين";
            return (
              <div key={group.key} className="border-b border-gray-100">
                <button
                  onClick={() => toggle(group.key)}
                  className="flex w-full items-center gap-2 bg-gray-50 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
                >
                  {collapsed ? <ChevronLeft className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                  {group.employee ? (
                    <span
                      className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[9px] font-semibold text-white"
                      style={{ background: colorFor(group.key) }}
                    >
                      {initials(group.employee)}
                    </span>
                  ) : null}
                  <span>{name}</span>
                  <span className="text-xs font-normal text-gray-400">({group.tasks.length})</span>
                </button>

                {!collapsed && (
                  <>
                    <div
                      style={directoryRowGridStyle(true)}
                      className="border-b border-gray-100 bg-white px-2 py-1.5 text-xs font-semibold text-gray-500"
                    >
                      <div>عنوان المهمة</div>
                      <div>الحالة</div>
                      <div>الأولوية</div>
                      <div>الفريق</div>
                      <div>تاريخ البدء</div>
                      <div>الاستحقاق</div>
                    </div>
                    {group.tasks.map((task) => (
                      <DirectoryTaskRow
                        key={task.id}
                        task={task}
                        statuses={data.statuses}
                        employeesById={data.employeesById}
                        allEmployees={data.allEmployees}
                        assigneesByTask={data.assigneesByTask}
                        taskTypes={data.taskTypes}
                        tagsByTask={data.tagsByTask}
                        parentTitle={data.parentTitleByTask.get(task.id)}
                        linkedTaskIds={data.linkedTaskIds}
                        blockedTaskIds={data.blockedTaskIds}
                        unmetRequirementTaskIds={data.unmetRequirementTaskIds}
                        attachedTaskIds={data.attachedTaskIds}
                        commentedTaskIds={data.commentedTaskIds}
                        onOpenTask={(taskId) => navigate(`/tasks/by-assignee/task/${taskId}`)}
                        {...mutations}
                      />
                    ))}
                  </>
                )}
              </div>
            );
          })
        )}
      </div>

      <Outlet />
    </div>
  );
}
