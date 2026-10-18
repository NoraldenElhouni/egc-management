import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { Check, Crosshair, ListTree, Maximize2, Minus, Plus, Workflow } from "lucide-react";
import type { DependencyPair, StatusRow, TaskRow, TaskTypeLite } from "../../../hooks/tasks/useTaskBoard";
import { externalWaitIds, type DependencyFlags } from "../../../hooks/tasks/dependencyFlags";
import { WAIT_STYLE } from "../board/DependencyBadges";
import { useTemplateMode } from "../TemplateModeContext";
import { typeBadges, type TypeBadge } from "../board/taskTypeBadge";
import { arabicCount, criticalCount, dayAdapter, daysShort, spanShort, tasksCount } from "../gantt/ganttScale";
import { Badge } from "../gantt/GanttBar";
import { LinkMenu } from "../gantt/TaskGantt";
import { criticalPath, linkKey, type CriticalPathResult } from "../schedule/criticalPath";
import { workingDaysBetween } from "../board/workingDays";
import { flowLayout } from "./flowLayout";

// مخطط الروابط — the board's tasks as boxes and their links as arrows, laid
// out automatically by link order (flowLayout.ts). Construction Flow's main
// view, which a client gave us as the model (plans/construction-flow-comparison/).
// Reached at /tasks/board/:id/flow (TasksRoutes.tsx), from the same
// ["task-board", boardId] query as the list and the Gantt.
//
// The whole board at once: every task and subtask is its own box, placed only
// by its links. A subtask's box says which task it is under ("ضمن: …"); a
// parent's box has the Gantt's bracket edges and its subtask count. Boxes
// with no links (most parents) are packed in rows under the chart, in outline
// order — each parent followed by its subtasks — so a board with no links is
// a grid that reads like the list.
//
// Positions are never saved: the layout is recomputed from the links, so it
// can't go stale and two people can't disagree about it.
//
// Gestures: drag the dot on a box's exit edge (its left edge — the chart runs
// right → left) onto another box to make that one start after it; click a
// line to reverse or remove it; click a box to open the task; "+" on a box
// adds a task after it (the create dialog, preset to "after"); the wheel
// zooms around the cursor and dragging anywhere — boxes and lines too — pans
// (a drag never counts as a click). "المسار الحرج" colours the critical path
// (schedule/criticalPath.ts).

const NODE_W = 210;
const NODE_H = 76;
const GAP_X = 90;
const GAP_Y = 28;
const MARGIN = 40;
const MIN_ZOOM = 0.25;
const MAX_ZOOM = 2;
/** How close (screen px) to a box's entry the link drag snaps to it. */
const SNAP_PX = 80;
/** How far (screen px) the pointer moves before a press is a pan, not a click. */
const DRAG_PX = 4;
const DEFAULT_STATUS_COLOR = "#6B7280";

const isFinished = (category: string | undefined) => category === "done" || category === "closed";

interface TaskFlowProps {
  tasks: TaskRow[];
  statuses: StatusRow[];
  taskTypes: Map<string, TaskTypeLite>;
  dependencies: DependencyPair[];
  dependencyFlags: Map<string, DependencyFlags>;
  onOpenTask: (taskId: string) => void;
  onLink?: (pair: DependencyPair) => void;
  onUnlink?: (pair: DependencyPair) => void;
  onReverseLink?: (pair: DependencyPair) => void;
  /** "+" on a box: a new task after it, under the same parent. */
  onAddAfter?: (taskId: string, parentTaskId: string | null) => void;
  /** The toolbar's "إضافة مهمة" (always a main task — null parent). */
  onAddTask?: (parentTaskId: string | null) => void;
  readOnly?: boolean;
}

interface View {
  x: number;
  y: number;
  k: number;
}

export default function TaskFlow({
  tasks,
  statuses,
  taskTypes,
  dependencies,
  dependencyFlags,
  onOpenTask,
  onLink,
  onUnlink,
  onReverseLink,
  onAddAfter,
  onAddTask,
  readOnly = false,
}: TaskFlowProps) {
  const isTemplate = useTemplateMode();
  const adapter = useMemo(() => dayAdapter(isTemplate), [isTemplate]);
  const badges = useMemo(() => typeBadges(taskTypes), [taskTypes]);
  const statusById = useMemo(() => new Map(statuses.map((s) => [s.id, s])), [statuses]);
  const byId = useMemo(() => new Map(tasks.map((t) => [t.id, t])), [tasks]);
  // Every link on this board is drawn; only a wait on a task of another
  // board gets the stop icon.
  const externalWaits = useMemo(
    () => externalWaitIds(tasks, dependencies, dependencyFlags, (id) => statusById.get(id)?.category),
    [tasks, dependencies, dependencyFlags, statusById],
  );

  // A task's parent, or null (a main task) when its parent isn't loaded
  // (an assignee's filtered board).
  const parentOf = (task: TaskRow): string | null =>
    task.parent_task_id && byId.has(task.parent_task_id) ? task.parent_task_id : null;
  const childCount = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of tasks) if (t.parent_task_id && byId.has(t.parent_task_id)) map.set(t.parent_task_id, (map.get(t.parent_task_id) ?? 0) + 1);
    return map;
  }, [tasks, byId]);
  /** Titles from the main task down to this task's parent. */
  const ancestorsOf = (task: TaskRow): string[] => {
    const out: TaskRow[] = [];
    let cursor = parentOf(task);
    while (cursor) {
      const t = byId.get(cursor);
      if (!t || out.includes(t)) break;
      out.unshift(t);
      cursor = parentOf(t);
    }
    return out.map((t) => t.title);
  };

  const dayOf = (value: string | null) => (value ? adapter.toDay(value) : null);
  const startOf = (t: TaskRow) => dayOf(t.start_date) ?? Number.POSITIVE_INFINITY;

  // Every task in outline order — each parent followed by its subtasks,
  // siblings by start date — as the layout's first order inside a column and
  // the order of its packed rows, and every link with both ends on this board (another board's: the stop
  // / "!" icon says so).
  const { boxes, links } = useMemo(() => {
    const kids = new Map<string | null, { t: TaskRow; i: number }[]>();
    tasks.forEach((t, i) => {
      const parent = parentOf(t);
      const list = kids.get(parent) ?? [];
      list.push({ t, i });
      kids.set(parent, list);
    });
    for (const list of kids.values())
      list.sort((a, b) => {
        const sa = startOf(a.t);
        const sb = startOf(b.t);
        return sa === sb ? a.i - b.i : sa < sb ? -1 : 1;
      });
    const order: string[] = [];
    const seen = new Set<string>();
    const visit = (parent: string | null) => {
      for (const { t } of kids.get(parent) ?? []) {
        if (seen.has(t.id)) continue;
        seen.add(t.id);
        order.push(t.id);
        visit(t.id);
      }
    };
    visit(null);
    // A parent loop (refused on save, so only bad data) never reaches the top.
    for (const t of tasks) {
      if (seen.has(t.id)) continue;
      seen.add(t.id);
      order.push(t.id);
      visit(t.id);
    }
    const drawn = dependencies
      .filter((d) => byId.has(d.blocking_task_id) && byId.has(d.blocked_task_id))
      .map((d) => ({ pair: d, from: d.blocking_task_id, to: d.blocked_task_id }));
    return { boxes: order, links: drawn };
  }, [tasks, dependencies, byId, adapter]);

  const layout = useMemo(
    () =>
      flowLayout(
        boxes,
        links.map((l) => ({ from: l.from, to: l.to })),
        { nodeW: NODE_W, nodeH: NODE_H, gapX: GAP_X, gapY: GAP_Y },
      ),
    [boxes, links],
  );

  // --- Critical path, over the whole board --------------------------------
  const [focus, setFocus] = useState(false);
  const critical = useMemo((): { ok: boolean; result: CriticalPathResult | null } | null => {
    if (!focus) return null;
    const ids = new Set(tasks.map((t) => t.id));
    const outcome = criticalPath(
      tasks.map((t) => ({
        id: t.id,
        parent_task_id: t.parent_task_id,
        start_date: t.start_date,
        due_date: t.due_date,
        start_lag_days: t.start_lag_days,
        frozen: isFinished(statusById.get(t.status_id)?.category),
      })),
      dependencies.filter((d) => ids.has(d.blocking_task_id) && ids.has(d.blocked_task_id)),
      { plain: isTemplate },
    );
    return outcome.ok ? { ok: true, result: outcome.result } : { ok: false, result: null };
  }, [focus, tasks, dependencies, statusById, isTemplate]);
  const criticalResult = critical?.result ?? null;

  // --- Hover: the whole chain ---------------------------------------------
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const chain = useMemo(() => {
    if (!hoveredId) return null;
    const ids = new Set([hoveredId]);
    const walk = (from: "blocking_task_id" | "blocked_task_id", to: "blocking_task_id" | "blocked_task_id") => {
      const queue = [hoveredId];
      while (queue.length) {
        const id = queue.pop() as string;
        for (const dep of dependencies) {
          if (dep[from] === id && !ids.has(dep[to])) {
            ids.add(dep[to]);
            queue.push(dep[to]);
          }
        }
      }
    };
    walk("blocking_task_id", "blocked_task_id");
    walk("blocked_task_id", "blocking_task_id");
    return ids;
  }, [hoveredId, dependencies]);

  // --- Pan and zoom -------------------------------------------------------
  const viewportRef = useRef<HTMLDivElement>(null);
  const [view, setView] = useState<View>({ x: MARGIN, y: MARGIN, k: 1 });
  const viewRef = useRef(view);
  viewRef.current = view;

  const fit = () => {
    const el = viewportRef.current;
    if (!el || layout.width === 0) return;
    const w = el.clientWidth;
    const h = el.clientHeight;
    const k = Math.max(MIN_ZOOM, Math.min(1.2, (w - MARGIN * 2) / layout.width, (h - MARGIN * 2) / layout.height));
    // Columns run right → left: hold the first column to the right edge
    // when the chart is wider than the screen.
    const x = layout.width * k < w - MARGIN * 2 ? (w - layout.width * k) / 2 : w - MARGIN - layout.width * k;
    setView({ x, y: Math.max(MARGIN, (h - layout.height * k) / 2), k });
  };
  // Fit once, when the chart is first laid out.
  const fitted = useRef(false);
  useLayoutEffect(() => {
    if (fitted.current || layout.width === 0) return;
    fitted.current = true;
    fit();
  }, [layout]);

  const zoomAt = (factor: number, cx: number, cy: number) =>
    setView((v) => {
      const k = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, v.k * factor));
      return { k, x: cx - ((cx - v.x) * k) / v.k, y: cy - ((cy - v.y) * k) / v.k };
    });
  const zoomCentre = (factor: number) => {
    const el = viewportRef.current;
    if (el) zoomAt(factor, el.clientWidth / 2, el.clientHeight / 2);
  };

  // The wheel zooms around the cursor, like Construction Flow (panning is
  // dragging). Native, non-passive: React's onWheel can't preventDefault.
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const delta = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY;
      // A trackpad pinch arrives as Ctrl + small deltas: zoom it faster.
      const rate = e.ctrlKey ? 0.01 : 0.002;
      zoomAt(Math.min(1.25, Math.max(0.8, Math.exp(-delta * rate))), e.clientX - rect.left, e.clientY - rect.top);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  /** Screen point → chart coordinates. */
  const toChart = (clientX: number, clientY: number) => {
    const rect = viewportRef.current?.getBoundingClientRect();
    const v = viewRef.current;
    if (!rect) return { x: 0, y: 0 };
    return { x: (clientX - rect.left - v.x) / v.k, y: (clientY - rect.top - v.y) / v.k };
  };

  // A press anywhere but a box's link dot pans once it moves DRAG_PX; the
  // click that ends such a drag is swallowed, so dragging over a box or a
  // line never opens it.
  const [panning, setPanning] = useState<{ sx: number; sy: number; ox: number; oy: number } | null>(null);
  const dragged = useRef(false);
  const onPressDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    dragged.current = false;
    if (e.button !== 0) return;
    if ((e.target as HTMLElement).closest("[data-flow-handle]")) return;
    setPanning({ sx: e.clientX, sy: e.clientY, ox: viewRef.current.x, oy: viewRef.current.y });
  };
  const onClickAfterDrag = (e: ReactMouseEvent<HTMLDivElement>) => {
    if (!dragged.current) return;
    dragged.current = false;
    e.preventDefault();
    e.stopPropagation();
  };
  useEffect(() => {
    if (!panning) return;
    const move = (e: PointerEvent) => {
      const dx = e.clientX - panning.sx;
      const dy = e.clientY - panning.sy;
      if (!dragged.current && Math.hypot(dx, dy) < DRAG_PX) return;
      dragged.current = true;
      setView((v) => ({ ...v, x: panning.ox + dx, y: panning.oy + dy }));
    };
    const up = () => setPanning(null);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
  }, [panning]);

  // --- Drag a link from a box's dot -----------------------------------------
  const canLink = !readOnly && !!onLink;
  const [linking, setLinking] = useState<{ fromId: string; x: number; y: number; targetId: string | null } | null>(null);
  const linkingRef = useRef(linking);
  linkingRef.current = linking;
  const linkActive = !!linking;
  useEffect(() => {
    if (!linkActive) return;
    const move = (e: PointerEvent) => {
      const p = toChart(e.clientX, e.clientY);
      const k = viewRef.current.k;
      let best: string | null = null;
      let bestDist = Number.POSITIVE_INFINITY;
      for (const id of boxes) {
        if (id === linkingRef.current?.fromId) continue;
        const pos = layout.nodes.get(id);
        if (!pos) continue;
        // a box's entry is its right edge (the chart runs right → left)
        const ex = pos.x + NODE_W;
        const ey = pos.y + NODE_H / 2;
        const dist = Math.hypot(p.x - ex, p.y - ey);
        const inside = p.x >= pos.x - 20 && p.x <= pos.x + NODE_W + 20 && p.y >= pos.y - 20 && p.y <= pos.y + NODE_H + 20;
        if ((inside || dist < SNAP_PX / k) && dist < bestDist) {
          best = id;
          bestDist = dist;
        }
      }
      setLinking((prev) => prev && { ...prev, x: p.x, y: p.y, targetId: best });
    };
    const up = () => {
      const done = linkingRef.current;
      setLinking(null);
      if (done?.targetId) onLink?.({ blocking_task_id: done.fromId, blocked_task_id: done.targetId });
    };
    const key = (e: KeyboardEvent) => e.key === "Escape" && setLinking(null);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("keydown", key);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("keydown", key);
    };
  }, [linkActive, boxes, layout, onLink]);

  const [linkMenu, setLinkMenu] = useState<{ x: number; y: number; pair: DependencyPair } | null>(null);
  const [hoveredLink, setHoveredLink] = useState<string | null>(null);
  const titleById = useMemo(() => new Map(tasks.map((t) => [t.id, t.title])), [tasks]);

  // --- Link lines -----------------------------------------------------------
  const paths = useMemo(() => {
    // Several links into or out of one box spread along its edge.
    const outs = new Map<string, typeof links>();
    const ins = new Map<string, typeof links>();
    for (const l of links) {
      outs.set(l.from, [...(outs.get(l.from) ?? []), l]);
      ins.set(l.to, [...(ins.get(l.to) ?? []), l]);
    }
    const yOf = (id: string) => layout.nodes.get(id)?.y ?? 0;
    const offset = (list: typeof links, l: (typeof links)[number], other: (x: (typeof links)[number]) => string) => {
      const sorted = list.slice().sort((a, b) => yOf(other(a)) - yOf(other(b)));
      const n = sorted.length;
      const step = n > 1 ? Math.min(14, (NODE_H - 24) / (n - 1)) : 0;
      return NODE_H / 2 + (sorted.indexOf(l) - (n - 1) / 2) * step;
    };
    return links.map((l) => {
      const a = layout.nodes.get(l.from);
      const b = layout.nodes.get(l.to);
      if (!a || !b) return null;
      const x1 = a.x;
      const y1 = a.y + offset(outs.get(l.from) ?? [], l, (x) => x.to);
      const x2 = b.x + NODE_W;
      const y2 = b.y + offset(ins.get(l.to) ?? [], l, (x) => x.from);
      const pts = [{ x: x1, y: y1 }, ...(layout.bends.get(`${l.from}>${l.to}`) ?? []), { x: x2, y: y2 }];
      let d = `M ${pts[0].x} ${pts[0].y}`;
      for (let i = 1; i < pts.length; i++) {
        const p = pts[i - 1];
        const q = pts[i];
        const dx = Math.max(30, Math.abs(q.x - p.x) / 2);
        d += ` C ${p.x - dx} ${p.y} ${q.x + dx} ${q.y} ${q.x} ${q.y}`;
      }
      const blocker = byId.get(l.pair.blocking_task_id);
      const blocked = byId.get(l.pair.blocked_task_id);
      const end = blocker ? dayOf(blocker.due_date) : null;
      const start = blocked ? dayOf(blocked.start_date) : null;
      const lag = blocked?.start_lag_days ?? 0;
      const mid = pts[Math.floor((pts.length - 1) / 2)];
      const midNext = pts[Math.floor((pts.length - 1) / 2) + 1] ?? mid;
      return {
        key: linkKey(l.pair),
        pair: l.pair,
        d,
        lag,
        label: lag > 0 ? { x: (mid.x + midNext.x) / 2, y: (mid.y + midNext.y) / 2 - 6 } : null,
        conflict: end !== null && start !== null && start <= end,
        inChain: !!chain && chain.has(l.pair.blocking_task_id) && chain.has(l.pair.blocked_task_id),
      };
    });
  }, [links, layout, byId, chain, adapter]);

  const linkFrom = linking ? layout.nodes.get(linking.fromId) : null;

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 px-4 py-2">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          {onAddTask && (
            <button
              onClick={() => onAddTask(null)}
              className="flex items-center gap-1 rounded-md bg-primary px-2.5 py-1 text-xs font-medium text-white hover:bg-primary/90"
            >
              <Plus className="h-3.5 w-3.5" />
              إضافة مهمة
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          {critical &&
            (critical.ok ? (
              <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700">
                {criticalCount(criticalResult?.count ?? 0)} — أي تأخير فيها يؤخر النهاية
              </span>
            ) : (
              <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                تعذّر حساب المسار الحرج — أعد تحميل الصفحة
              </span>
            ))}
          <span className="text-xs text-gray-500">
            {tasksCount(tasks.length)} ·{" "}
            {arabicCount(links.length, { one: "رابط واحد", two: "رابطان", few: "روابط", many: "رابطاً" })}
          </span>
          <div className="flex overflow-hidden rounded-md border border-gray-200">
            <button onClick={() => zoomCentre(1 / 1.2)} className="px-2 py-1 text-gray-600 hover:bg-gray-50" title="تصغير (عجلة التمرير)">
              <Minus className="h-3.5 w-3.5" />
            </button>
            <button onClick={() => zoomCentre(1.2)} className="border-r border-gray-200 px-2 py-1 text-gray-600 hover:bg-gray-50" title="تكبير (عجلة التمرير)">
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
          <button
            onClick={fit}
            className="flex items-center gap-1 rounded-md border border-gray-200 px-2 py-1 text-xs text-gray-600 hover:bg-gray-50"
          >
            <Maximize2 className="h-3.5 w-3.5" />
            ملاءمة الكل
          </button>
          <button
            onClick={() => setFocus((v) => !v)}
            aria-pressed={focus}
            title="المهام التي يؤخر أي تأخير فيها نهاية اللوحة"
            className={`flex items-center gap-1 rounded-md border px-2 py-1 text-xs ${
              focus ? "border-red-200 bg-red-50 font-medium text-red-700" : "border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            <Crosshair className="h-3.5 w-3.5" />
            المسار الحرج
          </button>
        </div>
      </div>

      <div
        ref={viewportRef}
        onPointerDown={onPressDown}
        onClickCapture={onClickAfterDrag}
        className={`relative flex-1 select-none overflow-hidden bg-gray-50 ${panning ? "cursor-grabbing" : "cursor-grab"}`}
        style={{
          backgroundImage: "radial-gradient(#D1D5DB 1.2px, transparent 1.2px)",
          backgroundSize: `${24 * view.k}px ${24 * view.k}px`,
          backgroundPosition: `${view.x}px ${view.y}px`,
          touchAction: "none",
        }}
      >
        {tasks.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-sm text-gray-400">
            <Workflow className="h-8 w-8 text-gray-300" />
            لا توجد مهام في هذه اللوحة بعد
          </div>
        ) : (
          <div
            className="absolute left-0 top-0"
            style={{ transform: `translate(${view.x}px, ${view.y}px) scale(${view.k})`, transformOrigin: "0 0", width: layout.width, height: layout.height }}
          >
            {/* links under the boxes */}
            <svg className="absolute left-0 top-0 overflow-visible" width={layout.width} height={layout.height}>
              <defs>
                <marker id="flow-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto">
                  <path d="M0,0L10,5L0,10z" fill="#6B7280" />
                </marker>
                <marker id="flow-arrow-red" viewBox="0 0 10 10" refX="9" refY="5" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto">
                  <path d="M0,0L10,5L0,10z" fill="#DC2626" />
                </marker>
                <marker id="flow-arrow-blue" viewBox="0 0 10 10" refX="9" refY="5" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto">
                  <path d="M0,0L10,5L0,10z" fill="#2563EB" />
                </marker>
              </defs>
              {paths.map((p) => {
                if (!p) return null;
                const onPath = !!criticalResult && criticalResult.criticalLinks.has(p.key);
                const red = p.conflict || onPath;
                const hot = hoveredLink === p.key;
                const blue = !red && (p.inChain || hot);
                const dim = (!!chain && !p.inChain) || (!!criticalResult && !onPath);
                const stroke = red ? "#DC2626" : blue ? "#2563EB" : "#6B7280";
                return (
                  <g key={p.key} opacity={dim ? 0.2 : 1}>
                    <path
                      d={p.d}
                      fill="none"
                      stroke={stroke}
                      strokeWidth={hot ? 3 : onPath || p.inChain ? 2.5 : 1.75}
                      strokeDasharray={p.lag > 0 ? "7 5" : undefined}
                      markerEnd={`url(#${red ? "flow-arrow-red" : blue ? "flow-arrow-blue" : "flow-arrow"})`}
                    />
                    {p.label && (
                      <text x={p.label.x} y={p.label.y} textAnchor="middle" fontSize={11} fill="#B45309">
                        انتظار {p.lag}
                      </text>
                    )}
                    {!readOnly && (onUnlink || onReverseLink) && !linking && (
                      <path
                        d={p.d}
                        fill="none"
                        stroke="transparent"
                        strokeWidth={14}
                        style={{ pointerEvents: "stroke", cursor: "pointer" }}
                        onMouseEnter={() => setHoveredLink(p.key)}
                        onMouseLeave={() => setHoveredLink(null)}
                        onClick={(e) => setLinkMenu({ x: e.clientX, y: e.clientY, pair: p.pair })}
                      />
                    )}
                  </g>
                );
              })}
              {linking && linkFrom && (
                <path
                  d={`M ${linkFrom.x} ${linkFrom.y + NODE_H / 2} L ${linking.x} ${linking.y}`}
                  stroke="#2563EB"
                  strokeWidth={2}
                  strokeDasharray="6 4"
                  fill="none"
                />
              )}
            </svg>

            {boxes.map((id) => {
              const pos = layout.nodes.get(id);
              const task = byId.get(id);
              if (!pos || !task) return null;
              return (
                <FlowBox
                  key={id}
                  task={task}
                  x={pos.x}
                  y={pos.y}
                  color={statusById.get(task.status_id)?.color ?? DEFAULT_STATUS_COLOR}
                  done={isFinished(statusById.get(task.status_id)?.category)}
                  subtitle={
                    task.start_date && task.due_date
                      ? (() => {
                          const s = adapter.toDay(task.start_date);
                          const e = adapter.toDay(task.due_date);
                          return `${spanShort(s, e, adapter)} · ${daysShort(task.duration_days ?? workingDaysBetween(s, e, isTemplate))}`;
                        })()
                      : "غير مجدولة"
                  }
                  externalWait={externalWaits.has(task.id)}
                  badge={badges.get(task.task_type_id) ?? null}
                  ancestors={ancestorsOf(task)}
                  subtasks={childCount.get(task.id) ?? 0}
                  onOpen={() => onOpenTask(task.id)}
                  onHover={(on) => setHoveredId(on ? task.id : null)}
                  onLinkStart={
                    canLink && !linking
                      ? (e) => {
                          e.stopPropagation();
                          const p = toChart(e.clientX, e.clientY);
                          setLinking({ fromId: task.id, x: p.x, y: p.y, targetId: null });
                        }
                      : undefined
                  }
                  onAddAfter={!readOnly && onAddAfter ? () => onAddAfter(task.id, parentOf(task)) : undefined}
                  linkTarget={linking?.targetId === task.id}
                  tone={
                    criticalResult
                      ? criticalResult.critical.has(task.id)
                        ? "critical"
                        : "dim"
                      : chain && !chain.has(task.id)
                        ? "dim"
                        : null
                  }
                  note={
                    criticalResult
                      ? criticalResult.critical.has(task.id)
                        ? "حرجة — أي تأخير فيها يؤخر النهاية"
                        : criticalResult.slack.has(task.id)
                          ? `يمكن أن تتأخر ${criticalResult.slack.get(task.id)} ${isTemplate ? "يوم" : "يوم عمل"} دون تأخير النهاية`
                          : null
                      : null
                  }
                />
              );
            })}
          </div>
        )}
      </div>
      <LinkMenu
        menu={linkMenu}
        titleById={titleById}
        onClose={() => setLinkMenu(null)}
        onUnlink={onUnlink}
        onReverse={onReverseLink}
      />
    </div>
  );
}

/** One task's box. */
function FlowBox({
  task,
  x,
  y,
  color,
  done,
  subtitle,
  externalWait,
  badge,
  ancestors,
  subtasks,
  onOpen,
  onHover,
  onLinkStart,
  onAddAfter,
  linkTarget,
  tone,
  note,
}: {
  task: TaskRow;
  x: number;
  y: number;
  color: string;
  done: boolean;
  subtitle: string;
  externalWait: boolean;
  badge: TypeBadge | null;
  /** Titles from the main task down to this task's parent; empty for a main task. */
  ancestors: string[];
  subtasks: number;
  onOpen: () => void;
  onHover: (on: boolean) => void;
  onLinkStart?: (e: ReactPointerEvent<HTMLElement>) => void;
  onAddAfter?: () => void;
  linkTarget: boolean;
  tone: "critical" | "dim" | null;
  note: string | null;
}) {
  const [hovered, setHovered] = useState(false);
  const ring = linkTarget
    ? "ring-2 ring-blue-500 ring-offset-2"
    : tone === "critical"
      ? "ring-2 ring-red-600"
      : task.is_overdue && !done
        ? "ring-2 ring-red-300"
        : "";
  const edge = done ? "#9CA3AF" : color;
  const parentTitle = ancestors[ancestors.length - 1] ?? null;
  return (
    <div
      onMouseEnter={() => {
        setHovered(true);
        onHover(true);
      }}
      onMouseLeave={() => {
        setHovered(false);
        onHover(false);
      }}
      className={`group absolute rounded-lg border bg-white shadow-sm transition-shadow hover:shadow-md ${ring}`}
      style={{
        left: x,
        top: y,
        width: NODE_W,
        height: NODE_H,
        opacity: tone === "dim" ? 0.35 : 1,
        borderColor: "#E5E7EB",
        borderRightWidth: 5,
        borderRightColor: edge,
        // a parent gets both edges, like the Gantt's summary brackets
        ...(subtasks > 0 && { borderLeftWidth: 3, borderLeftColor: edge }),
        background: done ? "#F9FAFB" : "white",
      }}
      title={[[...ancestors, task.title].join(" ← "), note].filter(Boolean).join(" · ")}
    >
      <button type="button" onClick={onOpen} className="flex h-full w-full flex-col justify-center gap-0.5 px-3 text-right">
        <span className={`flex min-w-0 items-center gap-1 text-[13px] font-semibold ${done ? "text-gray-500" : "text-gray-900"}`}>
          {externalWait && (
            <span title="تنتظر مهمة في لوحة أخرى" className="inline-flex shrink-0">
              <WAIT_STYLE.Icon className={`h-3.5 w-3.5 ${WAIT_STYLE.text}`} />
            </span>
          )}
          {done && <Check className="h-3.5 w-3.5 shrink-0 text-emerald-600" />}
          <span className={`truncate ${done ? "line-through decoration-gray-400" : ""}`}>{task.title}</span>
        </span>
        <span className="truncate text-[11px] text-gray-500">{subtitle}</span>
        {(subtasks > 0 || parentTitle) && (
          <span className="flex min-w-0 items-center gap-1 text-[11px] text-gray-500">
            {subtasks > 0 && (
              <span className="flex shrink-0 items-center gap-0.5">
                <ListTree className="h-3 w-3" />
                {arabicCount(subtasks, { one: "مهمة فرعية", two: "مهمتان فرعيتان", few: "مهام فرعية", many: "مهمة فرعية" })}
              </span>
            )}
            {subtasks > 0 && parentTitle && <span className="shrink-0">·</span>}
            {parentTitle && <span className="truncate">ضمن: {parentTitle}</span>}
          </span>
        )}
      </button>
      {badge && (
        <span className="pointer-events-none absolute left-2 top-2">
          <Badge badge={badge} />
        </span>
      )}
      {onLinkStart && hovered && (
        // the exit edge: the box's left side (the chart runs right → left)
        <span
          data-flow-handle
          onPointerDown={(e) => {
            if (e.button !== 0) return;
            e.preventDefault();
            onLinkStart(e);
          }}
          title="اسحب إلى مهمة أخرى لتبدأ بعد هذه"
          className="absolute -left-3 top-1/2 flex h-6 w-6 -translate-y-1/2 cursor-crosshair items-center justify-center"
        >
          <span className="h-3.5 w-3.5 rounded-full border-2 border-white bg-blue-500 shadow transition-transform hover:scale-125" />
        </span>
      )}
      {onAddAfter && hovered && (
        <button
          type="button"
          onClick={onAddAfter}
          title="إضافة مهمة بعد هذه"
          className="absolute -bottom-3 left-3 flex h-6 w-6 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 shadow-sm hover:text-primary"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
