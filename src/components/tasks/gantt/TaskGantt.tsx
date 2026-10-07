import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { useNavigate } from "react-router-dom";
import {
  CalendarX2,
  ChevronDown,
  ChevronLeft,
  ChevronsDown,
  ChevronsUp,
  Eye,
  EyeOff,
  Plus,
} from "lucide-react";
import type {
  DependencyPair,
  StatusRow,
  TaskRow,
  TaskTypeLite,
} from "../../../hooks/tasks/useTaskBoard";
import Tooltip from "../../ui/Tooltip";
import { useTemplateMode } from "../TemplateModeContext";
import GanttBar, { MILESTONE_HALF, MIN_BAR_W, ROW_H, type BarChange } from "./GanttBar";
import EditGuard from "../EditGuard";
import GanttDateCell from "./GanttDateCell";
import {
  MAX_PX_PER_DAY,
  MIN_PX_PER_DAY,
  ZOOM_LABELS,
  ZOOM_PX_PER_DAY,
  barSpan,
  computeRange,
  dayAdapter,
  fitRange,
  headerRows,
  spanLabel,
  weekendDays,
  zoomForPxPerDay,
  type BarSpan,
  type GanttZoom,
} from "./ganttScale";

// Board Gantt view — the same board as TaskTable, on a timeline.
// Reached at /tasks/board/:id/gantt (TasksRoutes.tsx); reads the same
// ["task-board", boardId] query as the list, so edits made in the task
// panel show up here without any extra invalidation.
//
// Layout: ONE scroll container in both axes. The left panel — start date,
// end date, task name, in reading order, so rightmost first (the page is
// dir="rtl") — is sticky to the right edge and the two-row date header is
// sticky to the top, so rows and bars stay aligned without syncing two
// separate scroll positions. Time runs right → left, like
// ProjectsDueDateTimeline.tsx — every horizontal position is a `right:`
// offset from the start of the visible range.
//
// Each date column can be hidden, and the name column is resized by
// dragging the line between it and the timeline. Zoom is continuous
// (pxPerDay): Ctrl/Cmd+scroll anywhere on the chart (a trackpad pinch
// arrives as Ctrl+wheel), or plain scroll over the date header. The
// Day / Week / Month buttons are presets of the same value.
//
// Scope (v1): drag a bar to move it, drag either end to resize it, edit
// dates in the columns, clear a task's dates from its name cell's hover
// button, dependency arrows drawn from task_dependencies. Dependencies
// are still added from the task panel, nothing is auto-scheduled, and
// moving a parent doesn't shift its subtasks.

const DATE_COL_W = 96;
const DEFAULT_NAME_W = 260;
const MIN_NAME_W = 140;
const MAX_NAME_W = 560;
const HEADER_ROW_H = 24;
const HEADER_H = HEADER_ROW_H * 2;
const INDENT_PX = 20;
const ZOOMS: GanttZoom[] = ["day", "week", "month"];
const DEFAULT_STATUS_COLOR = "#6B7280"; // same fallback as StatusCell.tsx
const ARROW_STUB = 8;

// localStorage — every access wrapped, since storage can be unreadable
// (private window, blocked site data) and none of this is worth failing
// the chart over. Same posture as TaskTable's loadBoardSort/saveBoardSort.
const PX_STORAGE_KEY = "tasks.ganttPxPerDay";
// Before scroll-zoom the saved choice was one of "day" | "week" | "month".
const LEGACY_ZOOM_STORAGE_KEY = "tasks.ganttZoom";
const COLUMNS_STORAGE_KEY = "tasks.ganttColumns";
const NAME_W_STORAGE_KEY = "tasks.ganttNameWidth";

function readStored(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStored(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // storage unavailable — the choice just won't be remembered
  }
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

function loadPxPerDay(): number {
  const raw = readStored(PX_STORAGE_KEY);
  if (raw !== null && Number.isFinite(Number(raw))) {
    return clamp(Number(raw), MIN_PX_PER_DAY, MAX_PX_PER_DAY);
  }
  const legacy = readStored(LEGACY_ZOOM_STORAGE_KEY);
  if (legacy && (ZOOMS as string[]).includes(legacy)) return ZOOM_PX_PER_DAY[legacy as GanttZoom];
  return ZOOM_PX_PER_DAY.day;
}

interface DateColumns {
  start: boolean;
  end: boolean;
}

function loadColumns(): DateColumns {
  try {
    const raw = readStored(COLUMNS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<DateColumns>;
      return { start: parsed.start !== false, end: parsed.end !== false };
    }
  } catch {
    // unparseable — use the default
  }
  return { start: true, end: true };
}

function loadNameWidth(): number {
  const n = Number(readStored(NAME_W_STORAGE_KEY));
  return Number.isFinite(n) && n > 0 ? clamp(n, MIN_NAME_W, MAX_NAME_W) : DEFAULT_NAME_W;
}

export interface GanttDateChange {
  startDate?: string | null;
  dueDate?: string | null;
}

// What a read-only Gantt calls instead of saving.
function ignoreDateChange(): void {
  return;
}

interface TaskGanttProps {
  boardId: string;
  tasks: TaskRow[];
  statuses: StatusRow[];
  taskTypes: Map<string, TaskTypeLite>;
  dependencies: DependencyPair[];
  blockedTaskIds: Set<string>;
  onChangeDates: (taskId: string, change: GanttDateChange) => void;
  /** No edit rights: bars open the task but cannot be dragged and the date
   * columns / clear button are inert. */
  readOnly?: boolean;
}

interface VisibleRow {
  task: TaskRow;
  depth: number;
  hasChildren: boolean;
}

export default function TaskGantt({
  boardId,
  tasks,
  statuses,
  taskTypes,
  dependencies,
  blockedTaskIds,
  onChangeDates: onChangeDatesProp,
  readOnly = false,
}: TaskGanttProps) {
  const onChangeDates = readOnly ? ignoreDateChange : onChangeDatesProp;
  const navigate = useNavigate();
  const isTemplate = useTemplateMode();
  const adapter = useMemo(() => dayAdapter(isTemplate), [isTemplate]);
  const todayRef = useRef<HTMLDivElement>(null);

  // Continuous zoom. `zoom` (which header cells to draw) is derived from it.
  const [pxPerDay, setPxPerDay] = useState(loadPxPerDay);
  const zoom = zoomForPxPerDay(pxPerDay);
  useEffect(() => {
    // Debounced: a scroll-zoom changes this on every wheel tick.
    const timer = setTimeout(() => writeStored(PX_STORAGE_KEY, String(Math.round(pxPerDay * 100) / 100)), 250);
    return () => clearTimeout(timer);
  }, [pxPerDay]);

  // The Day / Week / Month buttons. Unlike a scroll-zoom they re-center on
  // today (the effect further down), since a preset is a jump, not a nudge.
  const recenterRef = useRef(true); // true once at mount: open on today
  const setPreset = (z: GanttZoom) => {
    if (ZOOM_PX_PER_DAY[z] === pxPerDay) {
      scrollToToday();
      return;
    }
    recenterRef.current = true;
    setPxPerDay(ZOOM_PX_PER_DAY[z]);
  };

  // Left panel: two optional date columns, then the resizable name column.
  const [columns, setColumns] = useState(loadColumns);
  const toggleColumn = (key: keyof DateColumns) =>
    setColumns((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      writeStored(COLUMNS_STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  const [nameW, setNameW] = useState(loadNameWidth);
  const leftW = (columns.start ? DATE_COL_W : 0) + (columns.end ? DATE_COL_W : 0) + nameW;

  // Dragging the line on the name column's left edge (the boundary with
  // the timeline). RTL: the column's right edge is fixed against the date
  // columns, so moving the line LEFT (clientX shrinking) widens it.
  // Pointer capture keeps the drag alive when the pointer outruns the
  // 6px line; the same handlers serve the header cell and every row.
  const resizeRef = useRef<{ startX: number; startW: number } | null>(null);
  const [resizing, setResizing] = useState(false);
  const resizeHandlers = {
    onPointerDown: (e: ReactPointerEvent<HTMLElement>) => {
      if (e.button !== 0) return;
      e.preventDefault();
      e.currentTarget.setPointerCapture(e.pointerId);
      resizeRef.current = { startX: e.clientX, startW: nameW };
      setResizing(true);
    },
    onPointerMove: (e: ReactPointerEvent<HTMLElement>) => {
      const drag = resizeRef.current;
      if (drag) setNameW(clamp(drag.startW + (drag.startX - e.clientX), MIN_NAME_W, MAX_NAME_W));
    },
    onPointerUp: () => {
      resizeRef.current = null;
      setResizing(false);
    },
    onPointerCancel: () => {
      resizeRef.current = null;
      setResizing(false);
    },
  };
  useEffect(() => {
    if (!resizing) writeStored(NAME_W_STORAGE_KEY, String(nameW));
  }, [nameW, resizing]);

  // The scroll area's visible size — the timeline and its grid stretch to
  // fill it rather than ending partway across (or down) the screen.
  const [scrollEl, setScrollEl] = useState<HTMLDivElement | null>(null);
  const [viewport, setViewport] = useState({ width: 0, height: 0 });
  useEffect(() => {
    if (!scrollEl) return;
    const measure = () =>
      setViewport((prev) =>
        prev.width === scrollEl.clientWidth && prev.height === scrollEl.clientHeight
          ? prev
          : { width: scrollEl.clientWidth, height: scrollEl.clientHeight },
      );
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(scrollEl);
    return () => observer.disconnect();
  }, [scrollEl]);

  // Same tree as TaskTable.tsx: tasks arrive in sort_order, children
  // keyed by parent_task_id, top level under null.
  const childrenByParent = useMemo(() => {
    const map = new Map<string | null, TaskRow[]>();
    for (const t of tasks) {
      const list = map.get(t.parent_task_id) ?? [];
      list.push(t);
      map.set(t.parent_task_id, list);
    }
    return map;
  }, [tasks]);

  // Every parent starts collapsed, matching the list view. Lazy init is
  // enough here (unlike TaskTable's ref-guarded seed): this component
  // only mounts once the board has loaded.
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(
    () => new Set(tasks.filter((t) => childrenByParent.has(t.id)).map((t) => t.id)),
  );
  const toggleCollapse = (taskId: string) =>
    setCollapsedIds((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) next.delete(taskId);
      else next.add(taskId);
      return next;
    });
  const collapseAll = () =>
    setCollapsedIds(new Set(tasks.filter((t) => childrenByParent.has(t.id)).map((t) => t.id)));
  const expandAll = () => setCollapsedIds(new Set());

  const statusById = useMemo(() => new Map(statuses.map((s) => [s.id, s])), [statuses]);

  const spans = useMemo(() => {
    const map = new Map<string, BarSpan>();
    for (const t of tasks) map.set(t.id, barSpan(t, taskTypes, adapter));
    return map;
  }, [tasks, taskTypes, adapter]);

  // A parent with no dates of its own still shows where its subtree sits:
  // a thin summary line from its earliest descendant start to its latest
  // descendant due date.
  const rollups = useMemo(() => {
    const map = new Map<string, { startDay: number; endDay: number }>();
    const visit = (taskId: string): { startDay: number; endDay: number } | null => {
      let acc: { startDay: number; endDay: number } | null = null;
      for (const child of childrenByParent.get(taskId) ?? []) {
        const own = spans.get(child.id);
        const parts = [own && own.kind !== "none" ? own : null, visit(child.id)];
        for (const p of parts) {
          if (!p) continue;
          acc = acc
            ? { startDay: Math.min(acc.startDay, p.startDay), endDay: Math.max(acc.endDay, p.endDay) }
            : { startDay: p.startDay, endDay: p.endDay };
        }
      }
      if (acc) map.set(taskId, acc);
      return acc;
    };
    for (const t of childrenByParent.get(null) ?? []) visit(t.id);
    return map;
  }, [childrenByParent, spans]);

  const minDays = viewport.width > leftW ? Math.ceil((viewport.width - leftW) / pxPerDay) : 0;
  const range = useMemo(
    () => fitRange(computeRange(Array.from(spans.values()), adapter), zoom, adapter, minDays),
    [spans, adapter, zoom, minDays],
  );
  const header = useMemo(() => headerRows(range, zoom, adapter), [range, zoom, adapter]);
  const weekends = useMemo(() => weekendDays(range, zoom, adapter), [range, zoom, adapter]);
  const trackWidth = (range.endDay - range.startDay + 1) * pxPerDay;
  const xOf = (day: number) => (day - range.startDay) * pxPerDay;

  const rows = useMemo(() => {
    const out: VisibleRow[] = [];
    const walk = (parentId: string | null, depth: number) => {
      for (const task of childrenByParent.get(parentId) ?? []) {
        const hasChildren = childrenByParent.has(task.id);
        out.push({ task, depth, hasChildren });
        if (hasChildren && !collapsedIds.has(task.id)) walk(task.id, depth + 1);
      }
    };
    walk(null, 0);
    return out;
  }, [childrenByParent, collapsedIds]);

  const datedCount = useMemo(
    () => Array.from(spans.values()).filter((s) => s.kind !== "none").length,
    [spans],
  );
  const undatedCount = tasks.length - datedCount;

  // Dependency arrows, finish → start: from the blocker's due-date edge
  // (its LEFT edge, RTL) to the blocked task's start edge (its RIGHT
  // edge). Only edges with both ends visible on this board are drawn —
  // a blocker on another board is already shown by the lock icon. Red
  // when the blocked task starts before its blocker is due.
  const arrows = useMemo(() => {
    const rowIndexById = new Map(rows.map((r, i) => [r.task.id, i]));
    const x = (day: number) => (day - range.startDay) * pxPerDay;
    const startEdge = (s: BarSpan) =>
      s.kind === "milestone" ? x(s.startDay) + pxPerDay / 2 - MILESTONE_HALF : x(s.startDay);
    const endEdge = (s: BarSpan) =>
      s.kind === "milestone"
        ? x(s.startDay) + pxPerDay / 2 + MILESTONE_HALF
        : x(s.startDay) + Math.max((s.endDay - s.startDay + 1) * pxPerDay, MIN_BAR_W);

    const out: { key: string; d: string; conflict: boolean }[] = [];
    for (const dep of dependencies) {
      const from = rowIndexById.get(dep.blocking_task_id);
      const to = rowIndexById.get(dep.blocked_task_id);
      if (from === undefined || to === undefined || from === to) continue;
      const a = spans.get(dep.blocking_task_id);
      const b = spans.get(dep.blocked_task_id);
      if (!a || !b || a.kind === "none" || b.kind === "none") continue;

      // SVG coordinates run left → right; convert from right-offsets.
      const x1 = trackWidth - endEdge(a);
      const x2 = trackWidth - startEdge(b);
      const y1 = from * ROW_H + ROW_H / 2;
      const y2 = to * ROW_H + ROW_H / 2;
      let d: string;
      if (x2 <= x1 - ARROW_STUB * 2) {
        d = `M ${x1} ${y1} H ${x1 - ARROW_STUB} V ${y2} H ${x2}`;
      } else {
        // Blocked task starts at/before the blocker's end — route around:
        // out of the blocker, along the row boundary next to the blocked
        // row, and back in from its start side.
        const midY = to > from ? to * ROW_H : (to + 1) * ROW_H;
        d = `M ${x1} ${y1} H ${x1 - ARROW_STUB} V ${midY} H ${x2 + ARROW_STUB} V ${y2} H ${x2}`;
      }
      out.push({
        key: `${dep.blocking_task_id}-${dep.blocked_task_id}`,
        d,
        conflict: b.startDay < a.endDay,
      });
    }
    return out;
  }, [rows, dependencies, spans, trackWidth, range, pxPerDay]);

  const scrollToToday = () =>
    todayRef.current?.scrollIntoView({ inline: "center", block: "nearest" });

  // Open on today rather than on the start of the range, and re-center
  // after a preset button — but not after a scroll-zoom, which keeps the
  // date under the cursor fixed instead (below). scrollIntoView rather
  // than setting scrollLeft: in an RTL scroller scrollLeft runs negative,
  // which is easy to get backwards.
  useEffect(() => {
    if (!recenterRef.current) return;
    recenterRef.current = false;
    scrollToToday();
  }, [pxPerDay]);

  // --- Scroll-zoom -------------------------------------------------------
  // Ctrl/Cmd+wheel anywhere on the chart (Chromium delivers a trackpad
  // pinch as Ctrl+wheel), or a plain wheel over the date header. Anything
  // else is left alone, so scrolling over the rows still scrolls them.
  //
  // A native non-passive listener, not React's onWheel (passive, so its
  // preventDefault is silently ignored) — the same reason
  // ProjectsDueDateTimeline.tsx attaches its own. It is attached once, so
  // it reads the current layout through `latest`.
  const latest = useRef({ rangeStart: 0, leftW, pxPerDay });
  const pxTarget = useRef(pxPerDay); // where zoom is headed, ahead of React's render
  // The day under the cursor when a zoom burst began, and how far from the
  // scroller's right edge the cursor was. Held (not recomputed) until the
  // render lands, so several wheel ticks in one frame share one anchor.
  const anchorRef = useRef<{ day: number; cursorFromRight: number } | null>(null);

  useLayoutEffect(() => {
    latest.current = { rangeStart: range.startDay, leftW, pxPerDay };
  });

  useEffect(() => {
    if (!scrollEl) return;
    const onWheel = (e: WheelEvent) => {
      const overHeader = (e.target as HTMLElement).closest("[data-gantt-header]") !== null;
      if (!e.ctrlKey && !e.metaKey && !overHeader) return;
      e.preventDefault();

      // deltaMode 1 = lines (Firefox-style); 16px a line. Up / pinch-out
      // (negative deltaY) zooms in.
      const delta = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY;
      const factor = clamp(Math.exp(-delta * 0.002), 0.8, 1.25);
      const next = clamp(pxTarget.current * factor, MIN_PX_PER_DAY, MAX_PX_PER_DAY);
      if (next === pxTarget.current) return;

      if (!anchorRef.current) {
        const current = latest.current;
        // Over the sticky left panel there's no date under the cursor —
        // anchor on the timeline's own right edge instead.
        const cursorFromRight = Math.max(scrollEl.getBoundingClientRect().right - e.clientX, current.leftW);
        // scrollLeft is 0 at the right edge and negative scrolling left
        // (an RTL scroller in Electron's Chromium).
        const fromContentRight = -scrollEl.scrollLeft + cursorFromRight;
        anchorRef.current = {
          day: current.rangeStart + (fromContentRight - current.leftW) / current.pxPerDay,
          cursorFromRight,
        };
      }
      pxTarget.current = next;
      setPxPerDay(next);
    };
    scrollEl.addEventListener("wheel", onWheel, { passive: false });
    return () => scrollEl.removeEventListener("wheel", onWheel);
  }, [scrollEl]);

  // After the new scale has rendered, scroll so the anchored day sits under
  // the cursor again. Placed by absolute day, not by offset: a change of
  // header granularity re-snaps the range (fitRange), moving where the
  // range starts.
  useLayoutEffect(() => {
    pxTarget.current = pxPerDay;
    const anchor = anchorRef.current;
    anchorRef.current = null;
    if (!anchor || !scrollEl) return;
    const fromContentRight = leftW + (anchor.day - range.startDay) * pxPerDay;
    scrollEl.scrollLeft = -(fromContentRight - anchor.cursorFromRight);
  }, [pxPerDay]);

  const openTask = (taskId: string) => navigate(`/tasks/board/${boardId}/gantt/task/${taskId}`);

  const commit = (taskId: string, change: BarChange) =>
    onChangeDates(taskId, {
      ...(change.startDay !== undefined ? { startDate: adapter.fromDay(change.startDay) } : {}),
      ...(change.endDay !== undefined ? { dueDate: adapter.fromDay(change.endDay) } : {}),
    });

  const today = adapter.today;

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-gray-100 px-4 py-2">
        <div className="flex items-center gap-2">
          <div className="flex overflow-hidden rounded-md border border-gray-200" title="إظهار / إخفاء الأعمدة">
            <ColumnToggle label="تاريخ البدء" on={columns.start} onClick={() => toggleColumn("start")} />
            <ColumnToggle label="تاريخ الانتهاء" on={columns.end} onClick={() => toggleColumn("end")} />
          </div>
          <div
            className="flex overflow-hidden rounded-md border border-gray-200"
            title="Ctrl + عجلة التمرير للتكبير والتصغير"
          >
            {ZOOMS.map((z) => (
              <button
                key={z}
                onClick={() => setPreset(z)}
                className={`px-2.5 py-1 text-xs ${
                  zoom === z ? "bg-primary-superLight font-medium text-primary" : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                {ZOOM_LABELS[z]}
              </button>
            ))}
          </div>
          {today !== null && (
            <button
              onClick={scrollToToday}
              className="rounded-md border border-gray-200 px-2 py-1 text-xs text-gray-600 hover:bg-gray-50"
            >
              اليوم
            </button>
          )}
          {tasks.length > 0 && undatedCount > 0 && (
            <span className="text-xs text-gray-400">
              {datedCount === 0
                ? "لا توجد مهام بتواريخ بعد — انقر على صف لتحديد تاريخ"
                : `${undatedCount} بدون تاريخ — انقر على صفها لتحديده`}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={expandAll}
            className="flex items-center gap-1 rounded-md border border-gray-200 px-2 py-1 text-xs text-gray-600 hover:bg-gray-50"
          >
            <ChevronsDown className="h-3.5 w-3.5" />
            توسيع الكل
          </button>
          <button
            onClick={collapseAll}
            className="flex items-center gap-1 rounded-md border border-gray-200 px-2 py-1 text-xs text-gray-600 hover:bg-gray-50"
          >
            <ChevronsUp className="h-3.5 w-3.5" />
            طي الكل
          </button>
        </div>
      </div>

      {tasks.length === 0 ? (
        <div className="flex flex-1 items-center justify-center text-sm text-gray-400">
          لا توجد مهام في هذه اللوحة بعد
        </div>
      ) : (
        <div
          ref={setScrollEl}
          className="flex-1 overflow-auto"
          // scrollIntoView (open on today, the اليوم button, presets) centers
          // within the scrollport minus this padding — i.e. the timeline
          // beside the sticky left panel, not the whole width behind it.
          style={{ scrollPaddingRight: leftW }}
        >
          <div className="relative" style={{ width: leftW + trackWidth }}>
            {/* Date header — a plain wheel over it zooms (see the wheel
                listener); data-gantt-header is what that looks for. */}
            <div data-gantt-header className="sticky top-0 z-20 flex border-b border-gray-200 bg-white">
              <div
                className="sticky right-0 z-30 flex shrink-0 border-l border-gray-200 bg-white text-xs font-medium text-gray-500"
                style={{ width: leftW, height: HEADER_H }}
              >
                {columns.start && (
                  <div
                    className="flex shrink-0 items-end justify-center border-l border-gray-100 pb-1.5"
                    style={{ width: DATE_COL_W }}
                  >
                    تاريخ البدء
                  </div>
                )}
                {columns.end && (
                  <div
                    className="flex shrink-0 items-end justify-center border-l border-gray-100 pb-1.5"
                    style={{ width: DATE_COL_W }}
                  >
                    تاريخ الانتهاء
                  </div>
                )}
                <div className="relative flex shrink-0 items-end px-3 pb-1.5" style={{ width: nameW }}>
                  المهمة
                  <ResizeHandle active={resizing} handlers={resizeHandlers} />
                </div>
              </div>
              <div className="relative shrink-0" style={{ width: trackWidth, height: HEADER_H }}>
                {header.top.map((c) => {
                  const width = (c.endDay - c.startDay) * pxPerDay;
                  return (
                    <div
                      key={`t${c.startDay}`}
                      className="absolute top-0 flex items-center border-l border-gray-200 px-2 text-xs font-semibold text-gray-700"
                      style={{ right: xOf(c.startDay), width, height: HEADER_ROW_H }}
                    >
                      {/* A sliver of a month at the range's edge: no
                          label rather than a clipped one. Sticky, so the
                          label stays visible beside the left panel while
                          its month is scrolled under it. */}
                      {width >= 40 && (
                        <span className="sticky max-w-full truncate" style={{ right: leftW + 6 }}>
                          {c.label}
                        </span>
                      )}
                    </div>
                  );
                })}
                {header.bottom.map((c) => {
                  const isCurrent = today !== null && today >= c.startDay && today < c.endDay;
                  return (
                    <div
                      key={`b${c.startDay}`}
                      className={`absolute flex items-center justify-center overflow-hidden whitespace-nowrap border-l border-t border-gray-100 text-[11px] ${
                        isCurrent
                          ? "bg-blue-50 font-semibold text-blue-600"
                          : c.weekend
                            ? "bg-gray-50 text-gray-400"
                            : "text-gray-500"
                      }`}
                      style={{
                        top: HEADER_ROW_H,
                        right: xOf(c.startDay),
                        width: (c.endDay - c.startDay) * pxPerDay,
                        height: HEADER_ROW_H,
                      }}
                    >
                      {c.label}
                    </div>
                  );
                })}
                {today !== null && (
                  <div
                    ref={todayRef}
                    className={`pointer-events-none absolute w-0.5 ${zoom === "day" ? "" : "bg-blue-400"}`}
                    style={{ right: xOf(today) + pxPerDay / 2 - 1, top: HEADER_ROW_H, height: HEADER_ROW_H }}
                  />
                )}
              </div>
            </div>

            {/* Body — at least as tall as the visible area, so the grid
                doesn't stop under the last row. */}
            <div
              className="relative"
              style={{ height: Math.max(rows.length * ROW_H, viewport.height - HEADER_H) }}
            >
              {/* Weekend shading, grid lines, today line — behind the rows.
                  Period boundaries (week/month) are drawn darker than the
                  per-cell lines so the scale reads at a glance. */}
              <div className="pointer-events-none absolute inset-y-0" style={{ right: leftW, width: trackWidth }}>
                {weekends.map((day) => (
                  <div
                    key={`w${day}`}
                    className="absolute inset-y-0 bg-gray-50"
                    style={{ right: xOf(day), width: pxPerDay }}
                  />
                ))}
                {header.bottom.map((c) => (
                  <div
                    key={`b${c.startDay}`}
                    className="absolute inset-y-0 border-l border-gray-100"
                    style={{ right: xOf(c.startDay), width: (c.endDay - c.startDay) * pxPerDay }}
                  />
                ))}
                {header.top.map((c) => (
                  <div
                    key={`t${c.startDay}`}
                    className="absolute inset-y-0 border-l border-gray-200"
                    style={{ right: xOf(c.startDay), width: (c.endDay - c.startDay) * pxPerDay }}
                  />
                ))}
                {today !== null && (
                  <div
                    className="absolute inset-y-0 border-r-2 border-dashed border-blue-300"
                    style={{ right: xOf(today) + pxPerDay / 2 - 1 }}
                  />
                )}
              </div>

              {rows.map(({ task, depth, hasChildren }) => {
                const span = spans.get(task.id);
                const status = statusById.get(task.status_id);
                const color = status?.color ?? DEFAULT_STATUS_COLOR;
                const collapsed = collapsedIds.has(task.id);
                const rollup = rollups.get(task.id);
                return (
                  <div key={task.id} className="group flex" style={{ height: ROW_H }}>
                    <div
                      className="sticky right-0 z-10 flex shrink-0 border-b border-l border-gray-100 bg-white group-hover:bg-gray-50"
                      style={{ width: leftW }}
                    >
                      {columns.start && (
                        <div className="shrink-0 border-l border-gray-100" style={{ width: DATE_COL_W }}>
                          <EditGuard disabled={readOnly}>
                            <GanttDateCell
                              value={task.start_date}
                              onChange={(date) => onChangeDates(task.id, { startDate: date })}
                            />
                          </EditGuard>
                        </div>
                      )}
                      {columns.end && (
                        <div className="shrink-0 border-l border-gray-100" style={{ width: DATE_COL_W }}>
                          <EditGuard disabled={readOnly}>
                            <GanttDateCell
                              value={task.due_date}
                              overdue={task.is_overdue}
                              onChange={(date) => onChangeDates(task.id, { dueDate: date })}
                            />
                          </EditGuard>
                        </div>
                      )}
                      <div
                        className="relative flex shrink-0 items-center gap-1 pl-2"
                        style={{ width: nameW, paddingRight: 8 + depth * INDENT_PX }}
                      >
                        {hasChildren ? (
                          <button
                            onClick={() => toggleCollapse(task.id)}
                            className="shrink-0 text-gray-400 hover:text-gray-600"
                          >
                            {collapsed ? <ChevronLeft className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                          </button>
                        ) : (
                          <span className="w-3.5 shrink-0" />
                        )}
                        <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: color }} />
                        <button
                          onClick={() => openTask(task.id)}
                          className="min-w-0 truncate text-sm text-gray-800 hover:underline"
                        >
                          {task.title}
                        </button>
                        {/* Clear both dates — the task goes back to an
                            undated row, same as CalendarPopover's
                            "إزالة التاريخ" but for start and due at once. */}
                        {span && span.kind !== "none" && !readOnly && (
                          <Tooltip label="إزالة التواريخ" className="ms-auto shrink-0">
                            <button
                              onClick={() => onChangeDates(task.id, { startDate: null, dueDate: null })}
                              className="invisible rounded p-0.5 text-gray-400 hover:bg-gray-200 hover:text-red-500 group-hover:visible"
                            >
                              <CalendarX2 className="h-3.5 w-3.5" />
                            </button>
                          </Tooltip>
                        )}
                        <ResizeHandle active={resizing} handlers={resizeHandlers} />
                      </div>
                    </div>
                    <div
                      className="relative shrink-0 border-b border-gray-50 group-hover:bg-gray-50/50"
                      style={{ width: trackWidth }}
                    >
                      {span && span.kind !== "none" ? (
                        <GanttBar
                          span={span}
                          rangeStart={range.startDay}
                          pxPerDay={pxPerDay}
                          title={task.title}
                          color={color}
                          done={status?.category === "done" || status?.category === "closed"}
                          overdue={task.is_overdue}
                          blocked={blockedTaskIds.has(task.id)}
                          describe={(s, e) => spanLabel(s, e, adapter)}
                          labelInset={leftW + 6}
                          onOpen={() => openTask(task.id)}
                          onCommit={(change) => commit(task.id, change)}
                          readOnly={readOnly}
                        />
                      ) : rollup ? (
                        <RollupBar
                          right={xOf(rollup.startDay)}
                          width={(rollup.endDay - rollup.startDay + 1) * pxPerDay}
                        />
                      ) : (
                        <UndatedTrack
                          rangeStart={range.startDay}
                          pxPerDay={pxPerDay}
                          onPick={(day) => {
                            const date = adapter.fromDay(day);
                            onChangeDates(task.id, { startDate: date, dueDate: date });
                          }}
                        />
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Dependency arrows — above the bars, below the sticky name column. */}
              <svg
                className="pointer-events-none absolute top-0 z-[1]"
                style={{ right: leftW }}
                width={trackWidth}
                height={rows.length * ROW_H}
              >
                <defs>
                  <marker id="gantt-arrow" viewBox="0 0 6 6" refX="5" refY="3" markerWidth="6" markerHeight="6" orient="auto">
                    <path d="M0,0 L6,3 L0,6 z" fill="#9CA3AF" />
                  </marker>
                  <marker id="gantt-arrow-conflict" viewBox="0 0 6 6" refX="5" refY="3" markerWidth="6" markerHeight="6" orient="auto">
                    <path d="M0,0 L6,3 L0,6 z" fill="#EF4444" />
                  </marker>
                </defs>
                {arrows.map((a) => (
                  <path
                    key={a.key}
                    d={a.d}
                    fill="none"
                    stroke={a.conflict ? "#EF4444" : "#9CA3AF"}
                    strokeWidth={1.5}
                    markerEnd={`url(#${a.conflict ? "gantt-arrow-conflict" : "gantt-arrow"})`}
                  />
                ))}
              </svg>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/** One of the show/hide chips for the date columns. */
function ColumnToggle({ label, on, onClick }: { label: string; on: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={on}
      className={`flex items-center gap-1 px-2.5 py-1 text-xs ${
        on ? "bg-primary-superLight font-medium text-primary" : "text-gray-400 hover:bg-gray-50"
      }`}
    >
      {on ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
      {label}
    </button>
  );
}

/** The draggable line on the name column's left edge — where it meets the
 * timeline. Rendered in the header cell and in every row, so the line is
 * grabbable anywhere down its length; all copies share one set of
 * handlers (TaskGantt's resizeHandlers) and light up together while a
 * drag is in progress. */
function ResizeHandle({
  active,
  handlers,
}: {
  active: boolean;
  handlers: {
    onPointerDown: (e: ReactPointerEvent<HTMLElement>) => void;
    onPointerMove: (e: ReactPointerEvent<HTMLElement>) => void;
    onPointerUp: () => void;
    onPointerCancel: () => void;
  };
}) {
  return (
    <span
      {...handlers}
      title="اسحب لتغيير عرض العمود"
      className={`absolute inset-y-0 left-0 z-10 w-1.5 cursor-col-resize touch-none select-none transition-colors ${
        active ? "bg-primary" : "hover:bg-primary/40"
      }`}
    />
  );
}

/** A parent's summary line (no dates of its own) — not draggable; edit
 * the subtasks, or give the parent its own dates in the panel. */
function RollupBar({ right, width }: { right: number; width: number }) {
  return (
    <div
      className="pointer-events-none absolute border-x-2 border-gray-500"
      style={{ right, width: Math.max(width, MIN_BAR_W), top: ROW_H / 2 - 4, height: 8 }}
    >
      <div className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 bg-gray-400/70" />
    </div>
  );
}

/** A task with no dates: hovering shows which day a click would set
 * (start = due = that day). */
function UndatedTrack({
  rangeStart,
  pxPerDay,
  onPick,
}: {
  rangeStart: number;
  pxPerDay: number;
  onPick: (day: number) => void;
}) {
  const [hoverDay, setHoverDay] = useState<number | null>(null);
  // RTL: day 0 of the range is at the track's right edge.
  const dayAt = (e: ReactMouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    return rangeStart + Math.floor((rect.right - e.clientX) / pxPerDay);
  };
  return (
    <div
      className="absolute inset-0 cursor-pointer"
      onMouseMove={(e) => setHoverDay(dayAt(e))}
      onMouseLeave={() => setHoverDay(null)}
      onClick={(e) => onPick(dayAt(e))}
    >
      {hoverDay !== null && (
        <div
          className="pointer-events-none absolute flex items-center justify-center rounded border border-dashed border-gray-300 bg-gray-100 text-gray-400"
          style={{
            right: (hoverDay - rangeStart) * pxPerDay,
            width: Math.max(pxPerDay, MIN_BAR_W),
            top: (ROW_H - 20) / 2,
            height: 20,
          }}
        >
          {pxPerDay >= 14 && <Plus className="h-3 w-3" />}
        </div>
      )}
    </div>
  );
}
