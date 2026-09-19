import { useMemo, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { ChevronDown, ChevronLeft, Loader2, Search } from "lucide-react";
import { useTaskDirectory } from "../../hooks/tasks/useTaskDirectory";
import DirectoryTaskRow, { directoryRowGridStyle } from "../../components/tasks/board/DirectoryTaskRow";
import type { TaskRow, TaskTypeLite } from "../../hooks/tasks/useTaskBoard";

// Task Type view — same company-wide/cross-space scope and full inline
// edit as AssigneeViewPage.tsx, grouped by task_type_id instead. A task
// has exactly one type, so unlike the assignee view there's no
// duplication — one bucket per task.

interface TaskTypeGroup {
  key: string;
  taskType: TaskTypeLite | null;
  tasks: TaskRow[];
}

export default function TaskTypeViewPage() {
  const navigate = useNavigate();
  const { data, loading, error, includeClosed, setIncludeClosed, ...mutations } = useTaskDirectory();
  const [collapsedKeys, setCollapsedKeys] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const searching = search.trim().length > 0;

  const groups = useMemo<TaskTypeGroup[]>(() => {
    if (!data) return [];
    const term = search.trim().toLowerCase();
    const byType = new Map<string, TaskRow[]>();
    for (const task of data.tasks) {
      if (term && !task.title.toLowerCase().includes(term)) continue;
      const list = byType.get(task.task_type_id) ?? [];
      list.push(task);
      byType.set(task.task_type_id, list);
    }
    return Array.from(byType.entries())
      .map(([typeId, tasks]) => ({ key: typeId, taskType: data.taskTypes.get(typeId) ?? null, tasks }))
      .sort((a, b) => b.tasks.length - a.tasks.length);
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
        تعذّر تحميل المهام حسب النوع
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col" dir="rtl">
      <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-6 py-4">
        <h1 className="shrink-0 text-base font-semibold text-gray-900">المهام حسب نوع المهمة</h1>
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
            const name = group.taskType?.name_ar ?? "نوع";
            return (
              <div key={group.key} className="border-b border-gray-100">
                <button
                  onClick={() => toggle(group.key)}
                  className="flex w-full items-center gap-2 bg-gray-50 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
                >
                  {collapsed ? <ChevronLeft className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: group.taskType?.color ?? "#9CA3AF" }} />
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
                        onOpenTask={(taskId) => navigate(`/tasks/by-type/task/${taskId}`)}
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
